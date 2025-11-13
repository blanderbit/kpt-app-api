export interface ValidateFilesOptions {
  allowedPatterns?: RegExp[];
  onError?: (message: string) => void;
  errorMessage?: string;
}

const DEFAULT_ALLOWED_PATTERNS: RegExp[] = [/^image\/(jpeg|png)$/i, /^video\/mp4$/i];
const DEFAULT_ERROR_MESSAGE = 'Only image and video files are allowed.';

export const validateFiles = (
  input: File | File[] | null | undefined,
  options: ValidateFilesOptions = {},
): boolean => {
  if (!input) {
    return true;
  }

  const files = Array.isArray(input) ? input : [input];
  const { allowedPatterns = DEFAULT_ALLOWED_PATTERNS, onError, errorMessage } = options;

  const invalidFile = files.find((file) => !allowedPatterns.some((pattern) => pattern.test(file.type)));

  if (invalidFile) {
    onError?.(errorMessage ?? DEFAULT_ERROR_MESSAGE);
    return false;
  }

  return true;
};
