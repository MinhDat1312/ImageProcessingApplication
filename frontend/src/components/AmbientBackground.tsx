import '../styles/design-tokens.css';

export function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden>
      <div className="blob blob--one" />
      <div className="blob blob--two" />
      <div className="blob blob--three" />
    </div>
  );
}

export default AmbientBackground;
