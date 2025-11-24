import user from "../fixtures/user.json";

export function getEmail(): string {
  return (Cypress.env("E2E_EMAIL") as string) || user.email;
}

export function getPassword(): string {
  return (Cypress.env("E2E_PASSWORD") as string) || user.password;
}
