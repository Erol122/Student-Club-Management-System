using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SCM.Api.Models.Clubs;
using SCMS.Domain.Entities;
using SCMS.Domain.Enums;
using SCMS.Infrastructure.Persistence;

namespace SCM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ClubsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClubDto>>> GetClubs(
        [FromQuery] string? search,
        [FromQuery] string? category,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Clubs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(club =>
                club.Name.Contains(term) ||
                (club.Description != null && club.Description.Contains(term)) ||
                (club.Category != null && club.Category.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            var normalizedCategory = category.Trim();
            query = query.Where(club => club.Category == normalizedCategory);
        }

        var clubs = await query
            .OrderBy(club => club.Name)
            .Select(club => ToDto(club))
            .ToListAsync(cancellationToken);

        return Ok(clubs);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClubDto>> GetClub(Guid id, CancellationToken cancellationToken)
    {
        var club = await dbContext.Clubs
            .AsNoTracking()
            .Where(club => club.Id == id)
            .Select(club => ToDto(club))
            .SingleOrDefaultAsync(cancellationToken);

        return club is null ? NotFound() : Ok(club);
    }

    [HttpPost]
    public async Task<ActionResult<ClubDto>> CreateClub(
        CreateClubRequest request,
        CancellationToken cancellationToken)
    {
        var validationProblem = ValidateRequest(
            request.Name,
            request.Slug,
            request.Description,
            request.Category,
            request.Status);
        if (validationProblem is not null)
        {
            return validationProblem;
        }

        var slug = NormalizeSlug(request.Slug, request.Name);
        if (string.IsNullOrWhiteSpace(slug))
        {
            ModelState.AddModelError(nameof(request.Slug), "Slug must contain at least one letter or number.");
            return ValidationProblem(ModelState);
        }

        if (await SlugExists(slug, ignoredClubId: null, cancellationToken))
        {
            ModelState.AddModelError(nameof(request.Slug), "A club with this slug already exists.");
            return ValidationProblem(ModelState);
        }

        var club = new Club
        {
            Name = request.Name.Trim(),
            Slug = slug,
            Description = NormalizeOptionalText(request.Description),
            Category = NormalizeOptionalText(request.Category),
            Status = request.Status,
            CreatedByUserId = null
        };

        dbContext.Clubs.Add(club);
        await dbContext.SaveChangesAsync(cancellationToken);

        var dto = ToDto(club);
        return CreatedAtAction(nameof(GetClub), new { id = club.Id }, dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClubDto>> UpdateClub(
        Guid id,
        UpdateClubRequest request,
        CancellationToken cancellationToken)
    {
        var validationProblem = ValidateRequest(
            request.Name,
            request.Slug,
            request.Description,
            request.Category,
            request.Status);
        if (validationProblem is not null)
        {
            return validationProblem;
        }

        var club = await dbContext.Clubs.SingleOrDefaultAsync(club => club.Id == id, cancellationToken);
        if (club is null)
        {
            return NotFound();
        }

        var slug = NormalizeSlug(request.Slug, request.Name);
        if (string.IsNullOrWhiteSpace(slug))
        {
            ModelState.AddModelError(nameof(request.Slug), "Slug must contain at least one letter or number.");
            return ValidationProblem(ModelState);
        }

        if (await SlugExists(slug, id, cancellationToken))
        {
            ModelState.AddModelError(nameof(request.Slug), "A club with this slug already exists.");
            return ValidationProblem(ModelState);
        }

        var createdByUserId = NormalizeOptionalUserId(request.CreatedByUserId);
        if (createdByUserId.HasValue && !await UserExists(createdByUserId.Value, cancellationToken))
        {
            ModelState.AddModelError(
                nameof(request.CreatedByUserId),
                "CreatedByUserId must reference an existing user.");
            return ValidationProblem(ModelState);
        }

        club.Name = request.Name.Trim();
        club.Slug = slug;
        club.Description = NormalizeOptionalText(request.Description);
        club.Category = NormalizeOptionalText(request.Category);
        club.Status = request.Status;
        club.CreatedByUserId = createdByUserId;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(club));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteClub(Guid id, CancellationToken cancellationToken)
    {
        var club = await dbContext.Clubs.SingleOrDefaultAsync(club => club.Id == id, cancellationToken);
        if (club is null)
        {
            return NotFound();
        }

        dbContext.Clubs.Remove(club);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static ClubDto ToDto(Club club)
    {
        return new ClubDto(
            club.Id,
            club.Name,
            club.Slug,
            club.Description,
            club.Category,
            club.Status,
            club.CreatedByUserId,
            club.CreatedAt,
            club.UpdatedAt);
    }

    private async Task<bool> SlugExists(
        string slug,
        Guid? ignoredClubId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Clubs.IgnoreQueryFilters().AnyAsync(
            club => club.Slug == slug && (!ignoredClubId.HasValue || club.Id != ignoredClubId.Value),
            cancellationToken);
    }

    private async Task<bool> UserExists(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.Users.AnyAsync(user => user.Id == userId, cancellationToken);
    }

    private ActionResult? ValidateRequest(
        string name,
        string? slug,
        string? description,
        string? category,
        ClubStatus status)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            ModelState.AddModelError(nameof(name), "Club name is required.");
        }
        else if (name.Trim().Length > 150)
        {
            ModelState.AddModelError(nameof(name), "Club name cannot exceed 150 characters.");
        }

        if (!string.IsNullOrWhiteSpace(slug) && slug.Trim().Length > 150)
        {
            ModelState.AddModelError(nameof(slug), "Slug cannot exceed 150 characters.");
        }

        if (!string.IsNullOrWhiteSpace(description) && description.Trim().Length > 2000)
        {
            ModelState.AddModelError(nameof(description), "Description cannot exceed 2000 characters.");
        }

        if (!string.IsNullOrWhiteSpace(category) && category.Trim().Length > 100)
        {
            ModelState.AddModelError(nameof(category), "Category cannot exceed 100 characters.");
        }

        if (!Enum.IsDefined(status))
        {
            ModelState.AddModelError(nameof(status), "Club status is invalid.");
        }

        return ModelState.IsValid ? null : ValidationProblem(ModelState);
    }

    private static string NormalizeSlug(string? slug, string name)
    {
        var source = string.IsNullOrWhiteSpace(slug) ? name : slug;
        var normalized = Regex.Replace(source.Trim().ToLowerInvariant(), "[^a-z0-9]+", "-");
        return normalized.Trim('-');
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static Guid? NormalizeOptionalUserId(Guid? userId)
    {
        return userId is null || userId == Guid.Empty ? null : userId;
    }
}
