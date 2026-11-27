/** Formato visual de importes en soles. No modifica valores ni cálculos. */
const formato = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
});

export function formatoImporte(valor: number | string | null | undefined): string {
    return formato.format(Number(valor ?? 0));
}
