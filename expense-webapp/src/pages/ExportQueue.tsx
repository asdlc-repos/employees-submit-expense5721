import { useCallback, useEffect, useMemo, useState } from "react";
import { Shell } from "../components/Shell";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Table, proportional } from "@astryxdesign/core/Table";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { useToast } from "@astryxdesign/core/Toast";
import { listClaims, exportClaims, downloadBlob, ApiError, type ExpenseClaimSummary } from "../api";
import { formatCurrency } from "../utils";

export default function ExportQueue() {
  const [rows, setRows] = useState<ExpenseClaimSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const showToast = useToast();

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await listClaims({ status: "approved", exported: false, limit: 100 });
      setRows(list.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the export queue");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalAmount = useMemo(() => (rows ?? []).reduce((sum, r) => sum + r.amount, 0), [rows]);

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const blob = await exportClaims();
      const filename = `payroll-export-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadBlob(blob, filename);
      showToast({ body: "Export downloaded — claims marked as exported.", type: "info" });
      await load();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Export failed";
      setError(message);
      showToast({ body: message, type: "error" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Shell>
      <VStack gap={6}>
        <HStack justify="between" align="center">
          <Heading level={1}>Export Queue</Heading>
          <Button
            label="Export to payroll"
            variant="primary"
            isLoading={exporting}
            isDisabled={!rows || rows.length === 0}
            onClick={handleExport}
          />
        </HStack>

        <HStack gap={4} wrap="wrap">
          <Card variant="muted" width={260}>
            <VStack gap={1}>
              <Text type="supporting">Awaiting export</Text>
              <Heading level={2}>{rows?.length ?? "–"}</Heading>
              <Text type="supporting" color="secondary">
                approved claims
              </Text>
            </VStack>
          </Card>
          <Card variant="muted" width={260}>
            <VStack gap={1}>
              <Text type="supporting">Total amount</Text>
              <Heading level={2}>{rows ? formatCurrency(totalAmount) : "–"}</Heading>
              <Text type="supporting" color="secondary">
                this batch
              </Text>
            </VStack>
          </Card>
        </HStack>

        {error && (
          <Card variant="red">
            <Text>{error}</Text>
          </Card>
        )}

        {rows === null ? (
          <Center height={200}>
            <Spinner size="lg" label="Loading claims..." />
          </Center>
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing to export" description="Every approved claim has already been sent to payroll." />
        ) : (
          <Table
            data={rows}
            idKey="id"
            columns={[
              { key: "employeeId", header: "Employee", width: proportional(1) },
              {
                key: "expenseDate",
                header: "Date",
                width: proportional(1),
                renderCell: (row) => <Timestamp value={row.expenseDate} format="date" />,
              },
              { key: "category", header: "Category", width: proportional(1) },
              {
                key: "amount",
                header: "Amount",
                width: proportional(1),
                renderCell: (row) => formatCurrency(row.amount, row.currency),
              },
              { key: "description", header: "Description", width: proportional(2) },
            ]}
          />
        )}
      </VStack>
    </Shell>
  );
}
