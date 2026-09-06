export function isBackdropTarget(target: EventTarget | null, currentTarget: EventTarget): boolean {
  return target === currentTarget;
}
