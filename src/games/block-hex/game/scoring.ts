export function calculateMatchScore(layersCleared: number, chainStep: number): number {
  return 10 * layersCleared * (chainStep + 1)
}
