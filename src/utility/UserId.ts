export const generateUserId = (): string => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";

  // Generate two random letters
  const randomLetters1 = Array.from({ length: 2 }).map(
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  );

  // Generate two random numbers (0-9)
  const randomNumbers1 = Array.from({ length: 2 }).map(() =>
    Math.floor(Math.random() * 10).toString()
  );

  // Generate two random letters
  const randomLetters2 = Array.from({ length: 2 }).map(
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  );

  // Generate two random numbers (0-9)
  const randomNumbers2 = Array.from({ length: 2 }).map(() =>
    Math.floor(Math.random() * 10).toString()
  );

  // Combine letters and numbers to get userId of format XXNNXXNN
  return [
    ...randomLetters1,
    ...randomNumbers1,
    ...randomLetters2,
    ...randomNumbers2,
  ].join("");
};
