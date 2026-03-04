import { create } from 'zustand'

interface CubeState {
    hovered: boolean
    clicked: boolean
    bgOffset: { x: number; y: number }
    setHovered: (hovered: boolean) => void
    setClicked: (clicked: boolean) => void
    toggleClicked: () => void
    setBgOffset: (dx: number, dy: number) => void
}

export const useCubeStore = create<CubeState>((set) => ({
    hovered: false,
    clicked: false,
    bgOffset: { x: 0, y: 0 },
    setHovered: (hovered) => set({ hovered }),
    setClicked: (clicked) => set({ clicked }),
    toggleClicked: () => set((state) => ({ clicked: !state.clicked })),
    setBgOffset: (dx, dy) => set((state) => ({
        bgOffset: { x: state.bgOffset.x + dx, y: state.bgOffset.y + dy }
    }))
}))
