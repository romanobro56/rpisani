/** Shown only to the admin when previewing something that isn't published yet. */
export function DraftBanner({ editHref }: { editHref: string }) {
  return (
    <p className="draft-banner">
      <strong>Draft preview.</strong> Only you can see this page. <a href={editHref}>Back to editor</a>
    </p>
  );
}
