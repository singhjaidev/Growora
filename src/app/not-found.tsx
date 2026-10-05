import { ButtonLink, Logo } from '@/components/ui';
export default function NotFound() {
  return (
    <main id="main" className="error-page">
      <Logo />
      <div className="error-number">404 / ROUTE NOT FOUND</div>
      <h1>
        Signal lost<span className="lime">.</span>
      </h1>
      <p>This path doesn’t lead to an opportunity. Let’s get you moving in the right direction.</p>
      <div>
        <ButtonLink href="/">Return home</ButtonLink>
        <ButtonLink href="/app" secondary>
          Explore the platform
        </ButtonLink>
      </div>
    </main>
  );
}
