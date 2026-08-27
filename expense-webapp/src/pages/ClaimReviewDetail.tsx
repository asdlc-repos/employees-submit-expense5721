import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Shell } from "../components/Shell";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Thumbnail } from "@astryxdesign/core/Thumbnail";
import { Lightbox } from "@astryxdesign/core/Lightbox";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { Divider } from "@astryxdesign/core/Divider";
import {
  getClaim,
  approveClaim,
  rejectClaim,
  listClaims,
  receiptDataUrl,
  type ExpenseClaim,
  type ExpenseClaimSummary,
} from "../api";
import { formatCurrency, statusBadgeVariant, statusLabel } from "../utils";

export default function ClaimReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<ExpenseClaim | null>(null);
  const [history, setHistory] = useState<ExpenseClaimSummary[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [isLightboxOpen, setLightboxOpen] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const c = await getClaim(id);
      setClaim(c);
      const all = await listClaims({ limit: 100 });
      setHistory(all.data.filter((r) => r.employeeId === c.employeeId && r.id !== c.id).slice(0, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load claim");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleApprove() {
    if (!id) return;
    setApproving(true);
    setActionError(null);
    try {
      await approveClaim(id, comment.trim() || undefined);
      navigate("/review");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to approve claim");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!id) return;
    setRejecting(true);
    setActionError(null);
    try {
      await rejectClaim(id, comment.trim() || undefined);
      navigate("/review");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to reject claim");
    } finally {
      setRejecting(false);
    }
  }

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
  const isDecided = claim.status !== "pending";

  return (
    <Shell>
      <VStack gap={6}>
        <Breadcrumbs>
          <BreadcrumbItem href="/review">Review Queue</BreadcrumbItem>
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
          Submitted by {claim.employeeId} — <Timestamp value={claim.createdAt} format="relative" />
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
                    <Thumbnail src={receiptUrl} alt="Receipt" label="Receipt" onClick={() => setLightboxOpen(true)} />
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

                {isDecided ? (
                  claim.managerComment && (
                    <Card variant="muted">
                      <Text>{claim.managerComment}</Text>
                    </Card>
                  )
                ) : (
                  <>
                    <TextArea
                      label="Comment"
                      value={comment}
                      onChange={setComment}
                      placeholder="Add a comment (optional)"
                      isOptional
                      rows={3}
                    />
                    {actionError && (
                      <Card variant="red">
                        <Text>{actionError}</Text>
                      </Card>
                    )}
                    <HStack justify="end" gap={2}>
                      <Button label="Reject" variant="destructive" isLoading={rejecting} onClick={handleReject} />
                      <Button label="Approve" variant="primary" isLoading={approving} onClick={handleApprove} />
                    </HStack>
                  </>
                )}
              </VStack>
            </Card>
          </StackItem>
          <Card variant="muted" width={320}>
            <VStack gap={2}>
              <Heading level={4}>This employee's history</Heading>
              {history.length === 0 ? (
                <Text type="supporting" color="secondary">
                  No other claims from this employee.
                </Text>
              ) : (
                history.map((h) => (
                  <VStack key={h.id} gap={0}>
                    <Text type="supporting">
                      <Timestamp value={h.expenseDate} format="date" /> — {statusLabel(h.status)}: {h.category}{" "}
                      {formatCurrency(h.amount, h.currency)}
                    </Text>
                    <Divider />
                  </VStack>
                ))
              )}
            </VStack>
          </Card>
        </HStack>
      </VStack>
    </Shell>
  );
}
