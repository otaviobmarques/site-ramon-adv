import Image from "next/image";

/** Logo do Dr. Ramon Nunes. `tom="claro"` para fundos escuros, `tom="escuro"` para fundos claros. */
export function LogoMarca({ tom = "claro", altura = 40 }: { tom?: "claro" | "escuro"; altura?: number }) {
  const largura = Math.round((altura * 554) / 440);
  return (
    <span className="logo">
      <Image
        src={tom === "claro" ? "/brand/logo-mark-light.png" : "/brand/logo-mark.png"}
        alt=""
        width={largura}
        height={altura}
        priority
      />
      <span className="logo-txt">
        <strong>Dr. Ramon Nunes</strong>
        <small>Direito Bancário</small>
      </span>
    </span>
  );
}

export function LogoCompleto({ tom = "claro", largura = 280 }: { tom?: "claro" | "escuro"; largura?: number }) {
  return (
    <Image
      className="logo-full"
      src={tom === "claro" ? "/brand/logo-full-light.png" : "/brand/logo-full.png"}
      alt="Dr. Ramon Nunes · Direito Bancário"
      width={largura}
      height={Math.round((largura * 689) / 1341)}
    />
  );
}
