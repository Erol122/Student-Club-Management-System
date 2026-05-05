function claimValue(claims, keys) {
  return keys.map((key) => claims?.[key]).find(Boolean);
}

function roleFromClaims(claims) {
  const roles = Array.isArray(claims?.roles) ? claims.roles : [claims?.roles].filter(Boolean);
  const groups = Array.isArray(claims?.groups) ? claims.groups : [claims?.groups].filter(Boolean);
  const allClaims = [...roles, ...groups].map((value) => String(value).toLowerCase());

  if (allClaims.some((value) => value.includes('admin'))) return 'Admin';
  if (allClaims.some((value) => value.includes('leader'))) return 'Club Leader';

  return 'Member';
}

function initialsFor(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function accountToUser(account) {
  const claims = account?.idTokenClaims ?? {};
  const name = account?.name ?? claimValue(claims, ['name', 'preferred_username', 'upn']) ?? 'Signed-in user';
  const email = claimValue(claims, ['preferred_username', 'email', 'upn']);

  return {
    id: account?.homeAccountId,
    name,
    email,
    role: roleFromClaims(claims),
    avatar: initialsFor(name),
    program: 'Student',
  };
}
