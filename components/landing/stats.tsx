import { Counter } from "@/components/motion/counter";
import { Stagger, StaggerItem } from "@/components/motion/reveal";

export function Stats() {
  const items = [
    { big: <Counter to={24} suffix="×7" />, label: "replies — even at 2 am" },
    { big: <Counter to={1} prefix="<" suffix=" sec" />, label: "for the owner card to update" },
    {
      big: (
        <>
          ₹<Counter to={0.5} decimals={1} />–₹<Counter to={5} />
        </>
      ),
      label: "typical AI cost per chat",
    },
  ];
  return (
    <section aria-label="Key numbers" className="relative z-10 -mt-6 px-4 sm:px-6">
      <Stagger className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
        {items.map((s) => (
          <StaggerItem key={s.label} className="rounded-2xl border border-line bg-surface/95 p-6 text-center shadow-card backdrop-blur">
            <p className="font-heading text-4xl font-extrabold text-primary">{s.big}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
