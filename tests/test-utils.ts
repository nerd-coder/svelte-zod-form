export function getElement<T extends new (...args: unknown[]) => unknown>(
  container: HTMLElement,
  selector: string,
  type: T
): InstanceType<T> {
  const elm = container.querySelector(selector)
  if (!elm) throw new Error(`Element with selector ${selector} not found`)
  if (!(elm instanceof type))
    throw new Error(`Element with selector ${selector} is not an instance of ${type.name}`)

  return elm as InstanceType<T>
}
