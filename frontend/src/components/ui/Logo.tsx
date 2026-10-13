import logo from "../../assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  light?: boolean; // texto en blanco, para fondos oscuros (ej. pie de página)
}

const SIZE_PX: Record<NonNullable<LogoProps["size"]>, number> = {
  sm: 28,
  md: 36,
  lg: 56,
};

/** Marca única del sistema: el logo (gorro + urna) + la palabra "SGV".
 * Centralizado acá para que cambiarlo (tamaño, versión del logo, etc.)
 * no signifique editar navbar, footer, Login, Registro y sidebar por
 * separado. */
export function Logo({ size = "md", showText = true, light = false }: LogoProps) {
  const px = SIZE_PX[size];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <img src={logo} alt="SGV" style={{ height: px, width: "auto" }} />
      {showText && (
        <span
          style={{
            fontWeight: 800,
            fontSize: size === "lg" ? 30 : size === "md" ? 20 : 17,
            color: light ? "#ffffff" : "var(--sgv-ink, #1f1f4d)",
            letterSpacing: "0.02em",
          }}
        >
          SGV
        </span>
      )}
    </span>
  );
}

export default Logo;
