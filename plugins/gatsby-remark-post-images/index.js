import copyLinkedFiles from "gatsby-remark-copy-linked-files";
import remarkImages from "gatsby-remark-images";

const copyOptions = {
  destinationDir: ({ hash, name }) => `static/${hash}/${name}`,
};

export default async function remarkPostImages(args, options) {
  if (args.markdownNode.frontmatter?.optimizeImages === false) {
    return copyLinkedFiles(args, { ...copyOptions, ignoreFileExtensions: [] });
  }
  await remarkImages(args, options);
  return copyLinkedFiles(args, copyOptions);
}
