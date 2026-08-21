// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ upload: vi.fn(), toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("@/lib/trpc", () => ({
  trpc: { media: { upload: { useMutation: () => ({ mutate: state.upload, isPending: false }) } } },
}));
vi.mock("sonner", () => ({ toast: state.toast }));

import { MediaLibraryPage } from "./MediaLibraryPage";

const config = { agent: { id: 7, name: "Robô de teste" }, mediaAssets: [] };
const dropFile = (file: File) => ({ dataTransfer: { files: [file] } });

describe("MediaLibraryPage drag and drop", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("dispara o upload quando uma mídia é solta na área de biblioteca", async () => {
    render(<MediaLibraryPage config={config} onRefresh={vi.fn()} />);
    const file = new File(["imagem"], "sala.jpg", { type: "image/jpeg" });
    const zone = screen.getByText("Arraste e solte aqui").closest("div")!.parentElement!;

    fireEvent.dragOver(zone, dropFile(file));
    fireEvent.drop(zone, dropFile(file));

    await waitFor(() => expect(state.upload).toHaveBeenCalledWith(expect.objectContaining({ agentId: 7, filename: "sala.jpg", kind: "image", usage: "outbound" })));
  });

  it("rejeita no drop uma imagem quando a biblioteca está no modo de instrução PDF", () => {
    render(<MediaLibraryPage config={config} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Instrução PDF" }));
    const file = new File(["imagem"], "sala.png", { type: "image/png" });
    const zone = screen.getByText("Arraste e solte aqui").closest("div")!.parentElement!;

    fireEvent.drop(zone, dropFile(file));

    expect(state.toast.error).toHaveBeenCalledWith("Instruções internas devem ser carregadas em PDF.");
    expect(state.upload).not.toHaveBeenCalled();
  });
});
