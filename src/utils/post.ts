export const parseFilePathToPostSlug = (filePath: string) => {
  const filename = filePath.split("/").pop() ?? "";
  const filePureName = filename.split(".").slice(0, -1).join(".");
  return encodeURIComponent(filePureName);
};
