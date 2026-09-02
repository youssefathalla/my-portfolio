/**
 * Material/CDK version-alignment guard.
 * Verifies that installed @angular/material and @angular/cdk packages share the same major.minor version.
 */

/** The name and installed version of a package read from its `package.json`. */
export interface InstalledPackageVersion {
  readonly name: string;
  readonly version: string;
}

/**
 * Compares major and minor version segments of @angular/material and @angular/cdk.
 * Returns null on match, or an error message detailing the mismatch.
 */
export function validateMaterialCdkAlignment(
  material: InstalledPackageVersion,
  cdk: InstalledPackageVersion,
): string | null {
  const materialParts = material.version.split('.');
  const cdkParts = cdk.version.split('.');

  const materialMajor = materialParts[0];
  const materialMinor = materialParts[1];
  const cdkMajor = cdkParts[0];
  const cdkMinor = cdkParts[1];

  if (materialMajor === cdkMajor && materialMinor === cdkMinor) {
    return null;
  }

  return (
    `Material/CDK version alignment failed: ` +
    `${material.name}@${material.version} vs ${cdk.name}@${cdk.version} — ` +
    `major.minor must agree`
  );
}
