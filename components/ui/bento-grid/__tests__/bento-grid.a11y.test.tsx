import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import {
  BentoGrid,
  BentoTile,
  BentoTileMedia,
  BentoTileBody,
} from "../bento-grid"

describe("BentoGrid a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations — basic 2-col grid", async () => {
    const { container } = render(
      <BentoGrid cols={2}>
        <BentoTile span="half">
          <BentoTileBody>
            <p>Tile A</p>
          </BentoTileBody>
        </BentoTile>
        <BentoTile span="half">
          <BentoTileBody>
            <p>Tile B</p>
          </BentoTileBody>
        </BentoTile>
      </BentoGrid>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations — full + half span mix", async () => {
    const { container } = render(
      <BentoGrid cols={2}>
        <BentoTile span="full" aspect="21/9">
          <BentoTileMedia src="/hero.jpg" alt="Hero project showcase" />
          <BentoTileBody>
            <h3>Knowmentum</h3>
            <p>Knowledge platform for high-performers.</p>
          </BentoTileBody>
        </BentoTile>
        <BentoTile span="half" aspect="2/1">
          <BentoTileMedia src="/nyc.jpg" alt="Animal NYC project" />
          <BentoTileBody>
            <h3>Animal NYC</h3>
          </BentoTileBody>
        </BentoTile>
        <BentoTile span="half" aspect="2/1">
          <BentoTileMedia src="/la.jpg" alt="Animal LA project" />
          <BentoTileBody>
            <h3>Animal LA</h3>
          </BentoTileBody>
        </BentoTile>
      </BentoGrid>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations — contain vs cover tiles", async () => {
    const { container } = render(
      <BentoGrid cols={2}>
        <BentoTile span="half" aspect="4/3" fit="cover">
          <BentoTileMedia src="/project.jpg" alt="Project photo" />
          <BentoTileBody>
            <p>Cover image tile</p>
          </BentoTileBody>
        </BentoTile>
        <BentoTile span="half" aspect="4/3" fit="contain">
          <BentoTileMedia src="/logo.png" alt="Client logo" />
          <BentoTileBody>
            <p>Logo tile with natural fit</p>
          </BentoTileBody>
        </BentoTile>
      </BentoGrid>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations — clickable anchor tiles", async () => {
    const { container } = render(
      <BentoGrid cols={2}>
        <BentoTile
          span="full"
          aspect="2/1"
          href="https://animal.nyc/"
          target="_blank"
        >
          <BentoTileMedia src="/nyc.jpg" alt="Creative agency office in New York City" />
          <BentoTileBody>
            <h3>Animal NYC</h3>
            <p>Creative agency in New York City</p>
          </BentoTileBody>
        </BentoTile>
        <BentoTile
          span="half"
          aspect="4/3"
          href="https://animal.la/"
          target="_blank"
        >
          <BentoTileMedia src="/la.jpg" alt="Creative agency studio in Los Angeles" />
          <BentoTileBody>
            <h3>Animal LA</h3>
          </BentoTileBody>
        </BentoTile>
      </BentoGrid>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations — responsive 17-tile layout", async () => {
    const tiles = Array.from({ length: 17 }, (_, i) => ({
      id: i,
      span: i === 0 ? ("full" as const) : ("half" as const),
      aspect: i % 3 === 0 ? "21/9" : i % 3 === 1 ? "2/1" : "4/3",
      fit: i % 5 === 0 ? ("contain" as const) : ("cover" as const),
    }))

    const { container } = render(
      <BentoGrid cols={{ base: 1, md: 2 }}>
        {tiles.map((tile) => (
          <BentoTile key={tile.id} span={tile.span} aspect={tile.aspect} fit={tile.fit}>
            <BentoTileMedia
              src={`/project-${tile.id}.jpg`}
              alt={`Project ${tile.id} showcase`}
            />
            <BentoTileBody>
              <h3>Project {tile.id}</h3>
              <p>Description of project {tile.id}.</p>
            </BentoTileBody>
          </BentoTile>
        ))}
      </BentoGrid>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations — grid without media (text-only tiles)", async () => {
    const { container } = render(
      <BentoGrid cols={3}>
        <BentoTile span="full">
          <BentoTileBody>
            <h2>Featured Work</h2>
            <p>A selection of recent projects.</p>
          </BentoTileBody>
        </BentoTile>
        <BentoTile span="half">
          <BentoTileBody>
            <h3>Web Design</h3>
            <p>Custom websites and apps.</p>
          </BentoTileBody>
        </BentoTile>
        <BentoTile span="half">
          <BentoTileBody>
            <h3>Mobile Apps</h3>
            <p>iOS and Android experiences.</p>
          </BentoTileBody>
        </BentoTile>
      </BentoGrid>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
