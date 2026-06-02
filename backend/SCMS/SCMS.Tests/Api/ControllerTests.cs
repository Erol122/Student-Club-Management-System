using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCM.Api.Controllers;
using SCMS.Application.ClubContent;
using SCMS.Application.Clubs;
using SCMS.Application.ClubWorkflows;
using SCMS.Application.Common;
using SCMS.Application.Users;
using SCMS.Domain.Enums;
using SCMS.Tests.TestDoubles;

namespace SCMS.Tests.Api;

public sealed class ApiResultExtensionsTests
{
    [Fact]
    public void ToActionResult_WhenNotFound_ReturnsProblemDetailsWithRequestPath()
    {
        var controller = new ProbeController
        {
            ControllerContext = TestData.ControllerContext(path: "/api/clubs/123")
        };

        var result = controller.ToActionResult(new ServiceError(ServiceErrorType.NotFound, "Club was not found."));

        var objectResult = Assert.IsType<NotFoundObjectResult>(result);
        var details = Assert.IsType<ProblemDetails>(objectResult.Value);
        Assert.Equal(StatusCodes.Status404NotFound, details.Status);
        Assert.Equal("Resource not found", details.Title);
        Assert.Equal("Club was not found.", details.Detail);
        Assert.Equal("/api/clubs/123", details.Instance);
    }

    [Fact]
    public void ToActionResult_WhenConflict_ReturnsConflictProblemDetails()
    {
        var controller = new ProbeController
        {
            ControllerContext = TestData.ControllerContext(path: "/api/clubs")
        };

        var result = controller.ToActionResult(new ServiceError(ServiceErrorType.Conflict, "Duplicate slug."));

        var objectResult = Assert.IsType<ConflictObjectResult>(result);
        var details = Assert.IsType<ProblemDetails>(objectResult.Value);
        Assert.Equal(StatusCodes.Status409Conflict, details.Status);
        Assert.Equal("Conflict", details.Title);
        Assert.Equal("Duplicate slug.", details.Detail);
    }

    [Fact]
    public void ToActionResult_WhenForbidden_ReturnsForbid()
    {
        var controller = new ProbeController
        {
            ControllerContext = TestData.ControllerContext()
        };

        var result = controller.ToActionResult(new ServiceError(ServiceErrorType.Forbidden, "Nope."));

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public void ToActionResult_WhenValidation_ReturnsValidationProblemDetails()
    {
        var controller = new ProbeController
        {
            ControllerContext = TestData.ControllerContext(path: "/api/clubs")
        };
        var error = new ServiceError(
            ServiceErrorType.Validation,
            "Invalid.",
            new Dictionary<string, string[]>
            {
                [nameof(CreateClubRequest.Name)] = ["Club name is required."]
            });

        var result = controller.ToActionResult(error);

        var objectResult = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
        var details = Assert.IsType<ValidationProblemDetails>(objectResult.Value);
        Assert.Contains(nameof(CreateClubRequest.Name), details.Errors.Keys);
    }

    [Fact]
    public void TryGetCurrentUser_ReturnsCurrentUserFromHttpContextItems()
    {
        var currentUser = TestData.CurrentUser(AppRole.Admin);
        var controller = new ProbeController
        {
            ControllerContext = TestData.ControllerContext(currentUser)
        };

        var found = controller.TryGetCurrentUser(out var resolvedUser);

        Assert.True(found);
        Assert.Equal(currentUser.Id, resolvedUser.Id);
    }

    private sealed class ProbeController : ControllerBase
    {
    }
}

public sealed class MeControllerTests
{
    [Fact]
    public void GetCurrentUser_WhenContextHasUser_ReturnsOkUser()
    {
        var currentUser = TestData.CurrentUser(AppRole.Admin);
        var controller = new MeController
        {
            ControllerContext = TestData.ControllerContext(currentUser, "/api/me")
        };

        var result = controller.GetCurrentUser();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<CurrentUserDto>(ok.Value);
        Assert.Equal(currentUser.Id, dto.Id);
    }

    [Fact]
    public void GetCurrentUser_WhenContextHasNoUser_ReturnsUnauthorized()
    {
        var controller = new MeController
        {
            ControllerContext = TestData.ControllerContext(path: "/api/me")
        };

        var result = controller.GetCurrentUser();

        Assert.IsType<UnauthorizedResult>(result.Result);
    }
}

public sealed class ClubsControllerTests
{
    [Fact]
    public async Task GetClubs_WhenCurrentUserIsMissing_ReturnsUnauthorized()
    {
        var controller = new ClubsController(new StubClubService(), new StubClubWorkflowService())
        {
            ControllerContext = TestData.ControllerContext(path: "/api/clubs")
        };

        var result = await controller.GetClubs(null, null, CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task CreateClub_WhenServiceSucceeds_ReturnsCreatedAtGetClub()
    {
        var dto = new ClubDto(
            Guid.NewGuid(),
            "Robotics",
            "robotics",
            null,
            "Engineering",
            null,
            null,
            null,
            ClubStatus.Active,
            null,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow,
            []);
        var clubService = new StubClubService
        {
            CreateResult = ServiceResult<ClubDto>.Success(dto)
        };
        var controller = new ClubsController(clubService, new StubClubWorkflowService())
        {
            ControllerContext = TestData.ControllerContext(TestData.CurrentUser(AppRole.Admin), "/api/clubs")
        };

        var result = await controller.CreateClub(
            new CreateClubRequest("Robotics", null, null, "Engineering", ClubStatus.Active),
            CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(ClubsController.GetClub), created.ActionName);
        Assert.Equal(dto.Id, created.RouteValues!["id"]);
        Assert.Same(dto, created.Value);
    }

    [Fact]
    public async Task DeleteClub_WhenWorkflowReturnsNotFound_MapsServiceError()
    {
        var workflowService = new StubClubWorkflowService
        {
            DeleteResult = ServiceResult.Failure(new ServiceError(ServiceErrorType.NotFound, "Club was not found."))
        };
        var controller = new ClubsController(new StubClubService(), workflowService)
        {
            ControllerContext = TestData.ControllerContext(TestData.CurrentUser(AppRole.Admin), "/api/clubs/1")
        };

        var result = await controller.DeleteClub(Guid.NewGuid(), CancellationToken.None);

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        var details = Assert.IsType<ProblemDetails>(notFound.Value);
        Assert.Equal("Club was not found.", details.Detail);
    }

    private sealed class StubClubService : IClubService
    {
        public ServiceResult<ClubDto> CreateResult { get; set; } =
            ServiceResult<ClubDto>.Failure(new ServiceError(ServiceErrorType.Forbidden, "Forbidden."));

        public Task<IReadOnlyList<ClubDto>> GetClubsAsync(
            CurrentUserDto currentUser,
            string? search,
            string? category,
            CancellationToken cancellationToken)
        {
            return Task.FromResult<IReadOnlyList<ClubDto>>([]);
        }

        public Task<ClubDto?> GetClubAsync(CurrentUserDto currentUser, Guid id, CancellationToken cancellationToken)
        {
            return Task.FromResult<ClubDto?>(null);
        }

        public Task<ServiceResult<ClubDto>> CreateClubAsync(
            CurrentUserDto currentUser,
            CreateClubRequest request,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(CreateResult);
        }

        public Task<ServiceResult<ClubDto>> UpdateClubAsync(
            CurrentUserDto currentUser,
            Guid id,
            UpdateClubRequest request,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(CreateResult);
        }
    }

    private sealed class StubClubWorkflowService : IClubWorkflowService
    {
        public ServiceResult DeleteResult { get; set; } = ServiceResult.Success();

        public Task<ServiceResult<ClubProposalDto>> SubmitClubProposalAsync(
            CurrentUserDto currentUser,
            SubmitClubProposalRequest request,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(Failure<ClubProposalDto>());
        }

        public Task<ServiceResult<IReadOnlyList<ClubProposalDto>>> GetPendingClubProposalsAsync(
            CurrentUserDto currentUser,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(ServiceResult<IReadOnlyList<ClubProposalDto>>.Success([]));
        }

        public Task<ServiceResult<ClubProposalDto>> ApproveClubProposalAsync(
            CurrentUserDto currentUser,
            Guid clubId,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(Failure<ClubProposalDto>());
        }

        public Task<ServiceResult<ClubProposalDto>> RejectClubProposalAsync(
            CurrentUserDto currentUser,
            Guid clubId,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(Failure<ClubProposalDto>());
        }

        public Task<ServiceResult<JoinRequestDto>> SubmitJoinRequestAsync(
            CurrentUserDto currentUser,
            Guid clubId,
            SubmitJoinRequestRequest request,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(Failure<JoinRequestDto>());
        }

        public Task<ServiceResult<IReadOnlyList<JoinRequestDto>>> GetPendingJoinRequestsAsync(
            CurrentUserDto currentUser,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(ServiceResult<IReadOnlyList<JoinRequestDto>>.Success([]));
        }

        public Task<ServiceResult<JoinRequestDto>> ApproveJoinRequestAsync(
            CurrentUserDto currentUser,
            Guid requestId,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(Failure<JoinRequestDto>());
        }

        public Task<ServiceResult<JoinRequestDto>> RejectJoinRequestAsync(
            CurrentUserDto currentUser,
            Guid requestId,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(Failure<JoinRequestDto>());
        }

        public Task<ServiceResult> DeleteClubAsync(
            CurrentUserDto currentUser,
            Guid clubId,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(DeleteResult);
        }

        public Task<ServiceResult> LeaveClubAsync(
            CurrentUserDto currentUser,
            Guid clubId,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(ServiceResult.Success());
        }

        private static ServiceResult<T> Failure<T>()
        {
            return ServiceResult<T>.Failure(new ServiceError(ServiceErrorType.Forbidden, "Forbidden."));
        }
    }
}
