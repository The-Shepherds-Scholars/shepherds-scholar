import type { ReactNode } from 'react';

// Placeholder for screens not built yet. `wireframe` matches the numbered screen
// in the wireframes canvas, which lists each component and the endpoint it calls.
export default function PageStub({ title, wireframe, design, intro, children }: {
  title: string; wireframe?: number; design?: string; intro: ReactNode; children?: ReactNode;
}) {
  return (
    <main>
      <h1>{title}</h1>
      <p className="lead">{intro}</p>
      {children}
      <p className="todo" style={{ marginTop: 32 }}>
        {wireframe
          ? `To build: see wireframe ${wireframe} for this screen’s components and API calls.`
          : `To build: copy the finished layout from the “${design}” artboard in the design canvas.`}
      </p>
    </main>
  );
}
