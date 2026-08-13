import { Container } from '@/components/common/container';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AperturasLoading() {
  return (
    <>
      <Container>
        <div className="flex items-center justify-between flex-wrap gap-2.5 pb-5">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </Container>

      <Container>
        <Card>
          <CardHeader>
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-9 w-28" />
          </CardHeader>
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="h-4 w-16 ms-auto" />
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </>
  );
}
