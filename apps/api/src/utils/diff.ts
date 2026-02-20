/**
 * Diff Utility
 * Generate diffs between OpenAPI specifications
 */

export interface DiffResult {
  added: string[];
  removed: string[];
  modified: string[];
  preview: string;
}

/**
 * Generate a simple line-based diff between two YAML specs
 */
export function generateDiff(original: string, modified: string): DiffResult {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');

  const added: string[] = [];
  const removed: string[] = [];
  const modifiedList: string[] = [];
  const previewLines: string[] = [];

  // Simple line-by-line comparison
  const maxLength = Math.max(originalLines.length, modifiedLines.length);
  let i = 0;
  let j = 0;

  while (i < originalLines.length || j < modifiedLines.length) {
    const origLine = i < originalLines.length ? originalLines[i] : null;
    const modLine = j < modifiedLines.length ? modifiedLines[j] : null;

    if (origLine === null) {
      // Lines added at the end
      added.push(modLine!);
      previewLines.push(`+ ${modLine}`);
      j++;
    } else if (modLine === null) {
      // Lines removed at the end
      removed.push(origLine);
      previewLines.push(`- ${origLine}`);
      i++;
    } else if (origLine === modLine) {
      // Lines are the same
      previewLines.push(`  ${origLine}`);
      i++;
      j++;
    } else {
      // Lines are different - check if it's modification or add/remove
      const origTrimmed = origLine.trim();
      const modTrimmed = modLine.trim();

      if (origTrimmed && modTrimmed && origTrimmed !== modTrimmed) {
        // Likely a modification
        if (origLine.split(':')[0].trim() === modLine.split(':')[0].trim()) {
          modifiedList.push(modLine);
          previewLines.push(`- ${origLine}`);
          previewLines.push(`+ ${modLine}`);
          i++;
          j++;
        } else {
          // Different keys, treat as remove + add
          removed.push(origLine);
          added.push(modLine);
          previewLines.push(`- ${origLine}`);
          previewLines.push(`+ ${modLine}`);
          i++;
          j++;
        }
      } else if (!origTrimmed && modTrimmed) {
        // Empty line vs content
        added.push(modLine);
        previewLines.push(`+ ${modLine}`);
        j++;
      } else if (origTrimmed && !modTrimmed) {
        // Content vs empty line
        removed.push(origLine);
        previewLines.push(`- ${origLine}`);
        i++;
      } else {
        // Both empty or whitespace
        previewLines.push(`  ${origLine}`);
        i++;
        j++;
      }
    }
  }

  // Limit preview to significant changes
  const significantPreview = previewLines.filter((line, idx) => {
    if (line.startsWith('+ ') || line.startsWith('- ')) return true;
    // Include some context lines
    const hasChangeNearby = 
      (idx > 0 && (previewLines[idx - 1].startsWith('+ ') || previewLines[idx - 1].startsWith('- '))) ||
      (idx < previewLines.length - 1 && (previewLines[idx + 1].startsWith('+ ') || previewLines[idx + 1].startsWith('- ')));
    return hasChangeNearby;
  });

  return {
    added,
    removed,
    modified: modifiedList,
    preview: significantPreview.slice(0, 50).join('\n') // Limit to 50 lines
  };
}

/**
 * Generate a summary of changes
 */
export function generateChangeSummary(diff: DiffResult): string {
  const parts: string[] = [];

  if (diff.added.length > 0) {
    parts.push(`${diff.added.length} lines added`);
  }
  if (diff.removed.length > 0) {
    parts.push(`${diff.removed.length} lines removed`);
  }
  if (diff.modified.length > 0) {
    parts.push(`${diff.modified.length} lines modified`);
  }

  return parts.join(', ') || 'No changes detected';
}
