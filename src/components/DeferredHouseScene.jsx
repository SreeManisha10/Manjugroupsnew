import { lazy, Suspense } from 'react'

const HouseScene = lazy(() => import('./HouseScene'))

export default function DeferredHouseScene() {
  return <Suspense fallback={<div className="house-scene" aria-label="Loading 3D house preview" role="img" />}>
    <HouseScene />
  </Suspense>
}