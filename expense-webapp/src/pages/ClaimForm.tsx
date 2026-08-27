import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ISODateString } from "@astryxdesign/core/Calendar";
import { Shell } from "../components/Shell";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Selector } from "@astryxdesign/core/Selector";
import { DateInput } from "@astryxdesign/core/DateInput";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { FileInput } from "@astryxdesign/core/FileInput";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { getClaim, submitClaim, updateClaim, fileToBase64, type ClaimCategory } from "../api";

const CATEGORIES: ClaimCategory[] = ["Travel", "Meals", "Lodging", "Supplies", "Other"];

export default function ClaimForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [category, setCategory] = useState<ClaimCategory>("Travel");
  const [expenseDate, setExpenseDate] = useState<ISODateString | undefined>(undefined);
  const [amount, setAmount] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const claim = await getClaim(id);
        if (cancelled) return;
        // Contract: PUT /expense-claims/{id} only accepts a rejected claim
        // (400 otherwise) — the ClaimDetail screen only offers this route
        // when status is rejected, but guard again here for a direct visit.
        if (claim.status !== "rejected") {
          setLoadError("Only a rejected claim can be edited and resubmitted.");
          return;
        }
        setCategory(claim.category);
        setExpenseDate(claim.expenseDate as ISODateString);
        setAmount(claim.amount);
        setDescription(claim.description);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load claim");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit() {
    if (!expenseDate || amount == null || !description.trim()) {
      setSubmitError("Fill in category, date, amount, and description.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      let receipt: { receiptContentType: string; receiptData: string } | Record<string, never> = {};
      if (receiptFile) {
        receipt = {
          receiptContentType: receiptFile.type || "application/octet-stream",
          receiptData: await fileToBase64(receiptFile),
        };
      }
      const input = { amount, category, expenseDate, description: description.trim(), ...receipt };
      const result = isEdit && id ? await updateClaim(id, input) : await submitClaim(input);
      navigate(`/claims/${result.id}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell>
      <VStack gap={6} maxWidth={640}>
        <Breadcrumbs>
          <BreadcrumbItem href="/claims">My Claims</BreadcrumbItem>
          <BreadcrumbItem isCurrent>{isEdit ? "Edit claim" : "New claim"}</BreadcrumbItem>
        </Breadcrumbs>
        <Heading level={1}>{isEdit ? "Edit Claim" : "New Claim"}</Heading>

        {loading ? (
          <Center height={200}>
            <Spinner size="lg" label="Loading claim..." />
          </Center>
        ) : loadError ? (
          <Card variant="red">
            <Text>{loadError}</Text>
          </Card>
        ) : (
          <VStack gap={4}>
            <FormLayout>
              <HStack gap={4} wrap="wrap">
                <Selector
                  label="Category"
                  options={CATEGORIES}
                  value={category}
                  onChange={(v) => setCategory(v as ClaimCategory)}
                  isRequired
                />
                <DateInput label="Date" value={expenseDate} onChange={setExpenseDate} isRequired />
              </HStack>
              <NumberInput label="Amount" value={amount} onChange={setAmount} min={0} step={0.01} units="USD" isRequired />
              <TextArea
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="What was this expense for?"
                isRequired
                rows={4}
              />
              <FileInput
                label="Attach receipt"
                value={receiptFile}
                onChange={(f) => setReceiptFile(Array.isArray(f) ? (f[0] ?? null) : f)}
                accept="image/*,application/pdf"
                isOptional
              />
            </FormLayout>

            {submitError && (
              <Card variant="red">
                <Text>{submitError}</Text>
              </Card>
            )}

            <HStack justify="end" gap={2}>
              <Button label="Cancel" variant="secondary" onClick={() => navigate(-1)} />
              <Button
                label={isEdit ? "Resubmit claim" : "Submit claim"}
                variant="primary"
                isLoading={submitting}
                onClick={handleSubmit}
              />
            </HStack>
          </VStack>
        )}
      </VStack>
    </Shell>
  );
}
