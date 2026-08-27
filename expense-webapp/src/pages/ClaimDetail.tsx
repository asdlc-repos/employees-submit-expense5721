import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Shell } from "../components/Shell";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Thumbnail } from "@astryxdesign/core/Thumbnail";
import { Lightbox } from "@astryxdesign/core/Lightbox";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { getClaim, receiptDataUrl, type ExpenseClaim } from "../api";
import { formatCurrency, statusBadgeVariant, statusLabel } from "../utils";

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<ExpenseClaim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const c = await getClaim(id);
        if (!cancelled) setClaim(c);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load claim");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <Shell>
        <EmptyState title="Couldn't load this claim" description={error} />
      </Shell>
    );
  }

  if (!claim) {
    return (
      <Shell>
        <Center height={300}>
          <Spinner size="lg" label="Loading claim..." />
        </Center>
      </Shell>
    );
  }

  const receiptUrl = receiptDataUrl(claim.receiptContentType, claim.receiptData);

  return (
    <Shell>
      <VStack gap={6}>
        <Breadcrumbs>
          <BreadcrumbItem href="/claims">My Claims</BreadcrumbItem>
          <BreadcrumbItem isCurrent>
            {claim.category} — <Timestamp value={claim.expenseDate} format="date" />
          </BreadcrumbItem>
        </Breadcrumbs>

        <HStack gap={3} align="center">
          <Heading level={1}>
            {claim.category} — {formatCurrency(claim.amount, claim.currency)}
          </Heading>
          <Badge variant={statusBadgeVariant(claim.status)} label={statusLabel(claim.status)} />
        </HStack>
        <Text type="supporting" color="secondary">
          Submitted <Timestamp value={claim.createdAt} format="relative" isTimezoneShown={false} /> — Updated{" "}
          <Timestamp value={claim.updatedAt} format="relative" />
        </Text>

        <HStack gap={4} align="start" wrap="wrap">
          <StackItem size="fill">
            <Card>
              <VStack gap={4}>
                <Heading level={3}>Details</Heading>
                <Text>
                  <Timestamp value={claim.expenseDate} format="date_long" />
                </Text>
                <Text>{claim.description}</Text>
                {receiptUrl ? (
                  <>
                    <Thumbnail
                      src={receiptUrl}
                      alt="Receipt"
                      label="Receipt"
                      onClick={() => setLightboxOpen(true)}
                    />
                    <Lightbox
                      isOpen={isLightboxOpen}
                      onOpenChange={setLightboxOpen}
                      media={{ src: receiptUrl, alt: "Receipt" }}
                    />
                  </>
                ) : (
                  <Text type="supporting" color="secondary">
                    No receipt attached.
                  </Text>
                )}
                {claim.status === "rejected" && (
                  <HStack justify="end">
                    <Button
                      label="Edit and resubmit"
                      variant="primary"
                      onClick={() => navigate(`/claims/${claim.id}/edit`)}
                    />
                  </HStack>
                )}
              </VStack>
            </Card>
          </StackItem>
          <Card variant="muted" width={320}>
            <VStack gap={2}>
              <Heading level={4}>Manager decision</Heading>
              {claim.managerComment ? (
                <Text>{claim.managerComment}</Text>
              ) : (
                <Text type="supporting" color="secondary">
                  {claim.status === "pending" ? "Awaiting manager review." : "No comment left."}
                </Text>
              )}
            </VStack>
          </Card>
        </HStack>
      </VStack>
    </Shell>
  );
}
