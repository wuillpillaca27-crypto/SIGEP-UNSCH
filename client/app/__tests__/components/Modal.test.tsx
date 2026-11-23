import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import Modal from "@/app/components/ui/Modal";

const showModalOriginal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const closeOriginal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: jest.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    }),
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: jest.fn(function (this: HTMLDialogElement) {
      const wasOpen = this.open;
      this.removeAttribute("open");
      if (wasOpen) this.dispatchEvent(new Event("close"));
    }),
  });
});

afterEach(() => {
  if (showModalOriginal) Object.defineProperty(HTMLDialogElement.prototype, "showModal", showModalOriginal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  if (closeOriginal) Object.defineProperty(HTMLDialogElement.prototype, "close", closeOriginal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

describe("Modal", () => {
  it("expone el diálogo abierto con el título accesible y su contenido", () => {
    render(
      <Modal abierto titulo="Confirmar trámite" onCerrar={jest.fn()}>
        ¿Desea continuar?
      </Modal>,
    );

    const dialogo = screen.getByRole("dialog", { name: "Confirmar trámite" });
    expect(dialogo).toHaveAttribute("aria-modal", "true");
    expect(dialogo).toHaveAttribute("aria-labelledby", "modal-titulo");
    expect(dialogo).toHaveAttribute("open");
    expect(screen.getByText("¿Desea continuar?")).toBeInTheDocument();
  });

  it("solicita el cierre desde el botón y cuando el diálogo se cierra", () => {
    const onCerrar = jest.fn();
    const { rerender } = render(
      <Modal abierto titulo="Detalle" onCerrar={onCerrar}>Contenido</Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onCerrar).toHaveBeenCalledTimes(1);

    rerender(<Modal abierto={false} titulo="Detalle" onCerrar={onCerrar}>Contenido</Modal>);
    expect(onCerrar).toHaveBeenCalledTimes(2);
  });

  it("mantiene el diálogo cerrado cuando abierto es falso", () => {
    const { container } = render(
      <Modal abierto={false} titulo="Detalle" onCerrar={jest.fn()}>Contenido</Modal>,
    );

    expect(container.querySelector("dialog")).not.toHaveAttribute("open");
  });
});
