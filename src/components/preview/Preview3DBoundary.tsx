import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Catches anything the 3D tier throws and hands the session back to the flat
 * renderer.
 *
 * The failure this exists for is mundane rather than exotic: a flaky connection
 * drops the lazy three chunk mid-fetch. Without a boundary that is a white
 * screen on a product page, which is the worst outcome available. A shopper on
 * a bad connection should get the SVG room, not nothing.
 *
 * A class component because an error boundary still cannot be written with
 * hooks. This is the one place in the codebase that needs one.
 */
export class Preview3DBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onError: (reason: string) => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Demoting from here rather than from the render path: calling back into a
    // parent's state during render is what produces the "cannot update while
    // rendering" warning, and this fires after the commit.
    this.props.onError(error.message)
    console.warn('[kipekee] 3D preview failed', error, info.componentStack)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
