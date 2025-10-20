import { ReactNode } from 'react';

// These tags are available
type Tag = 'destructive';

type Props = {
  children(tags: Record<Tag, (chunks: ReactNode) => ReactNode>): ReactNode
};

export default function RichText({ children }: Props) {
  return (
    <div className="prose">
      {children({
        destructive: (chunks: ReactNode) => <span className='text-destructive'>{chunks}</span>,
      })}
    </div>
  );
}
