export function isError(value: unknown): value is Error {
	return (
		typeof value === "object" &&
		value !== null &&
		"name" in value &&
		typeof value.name === "string" &&
		"message" in value &&
		typeof value.message === "string" &&
		(!("stack" in value) || typeof value.stack === "string")
	);
}
