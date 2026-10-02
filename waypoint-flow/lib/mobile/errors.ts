export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const requireCondition = (condition: unknown, status: number, code: string, message: string): asserts condition => {
  if (!condition) throw new ApiError(status, code, message);
};
export function identifier(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new ApiError(422, "invalid_id", "Invalid record identifier.");
  return value;
}

