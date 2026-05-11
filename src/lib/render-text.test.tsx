import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderText } from "./render-text";

function Wrapper({ text }: { text: string }) {
  return <span>{renderText(text)}</span>;
}

describe("renderText", () => {
  it("renders plain text unchanged", () => {
    render(<Wrapper text="hello world" />);
    expect(screen.getByText("hello world")).toBeTruthy();
  });

  it("renders **bold** as <strong>", () => {
    const { container } = render(<Wrapper text="pay in **35 dias**" />);
    const strong = container.querySelector("strong");
    expect(strong).toBeTruthy();
    expect(strong?.textContent).toBe("35 dias");
  });

  it("renders ==highlight== as <strong> with text-secondary class", () => {
    const { container } = render(<Wrapper text="use ==#GummyOriginal==" />);
    const strong = container.querySelector("strong");
    expect(strong).toBeTruthy();
    expect(strong?.className).toContain("text-secondary");
    expect(strong?.textContent).toBe("#GummyOriginal");
  });

  it("renders [text](url) as <a> link", () => {
    const { container } = render(<Wrapper text="visit [gummy.com.br](https://gummy.com.br) now" />);
    const a = container.querySelector("a");
    expect(a).toBeTruthy();
    expect(a?.getAttribute("href")).toBe("https://gummy.com.br");
    expect(a?.textContent).toBe("gummy.com.br");
  });

  it("handles multiple markers in one string", () => {
    const { container } = render(<Wrapper text="**bold** and ==highlight==" />);
    const strongs = container.querySelectorAll("strong");
    expect(strongs.length).toBe(2);
  });
});
