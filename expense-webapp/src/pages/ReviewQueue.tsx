import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shell } from "../components/Shell";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { Selector } from "@astryxdesign/core/Selector";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { Table, proportional } from "@astryxdesign/core/Table";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@astryxdesign/core/Icon";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { listClaims, type ClaimStatus, type ExpenseClaimSummary } from "../api";
import { formatCurrency, statusBadgeVariant, statusLabel } from "../utils";

type TabValue = ClaimStatus;
const TABS: TabValue[] = ["pending", "approved", "rejected"];
const ALL_REPORTS = "__all__";

export default function ReviewQueue() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabValue>("pending");
  const [report, setReport] = useState<string>(ALL_REPORTS);
  const [rows, setRows] = useState<ExpenseClaimSummary[] | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, pending] = await Promise.all([
        listClaims({ status: tab, limit: 100 }),
        listClaims({ status: "pending", limit: 1 }),
      ]);
      setRows(list.data);
      setPendingCount(pending.count);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the review queue");
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const reports = useMemo(() => {
    const ids = new Set((rows ?? []).map((r) => r.employeeId));
    return Array.from(ids);
  }, [rows]);

  const approvedThisMonth = useMemo(() => {
    if (tab !== "approved" || !rows) return null;
    const now = new Date();
    const inMonth = rows.filter((r) => {
      const d = new Date(r.updatedAt);
      return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
    });
    return { count: inMonth.length, total: inMonth.reduce((sum, r) => sum + r.amount, 0) };
  }, [rows, tab]);

  const visibleRows = useMemo(() => {
    if (!rows) return null;
    return report === ALL_REPORTS ? rows : rows.filter((r) => r.employeeId === report);
  }, [rows, report]);

  return (
    <Shell>
      <VStack gap={6}>
        <HStack justify="between" align="center" wrap="wrap">
          <Heading level={1}>Review Queue</Heading>
          <Selector
            label="Report"
            isLabelHidden
            value={report}
            onChange={setReport}
            options={[
              { value: ALL_REPORTS, label: "All direct reports" },
              ...reports.map((id) => ({ value: id, label: id })),
            ]}
          />
        </HStack>

        <HStack gap={4} wrap="wrap">
          <Card variant="muted" width={260}>
            <VStack gap={1}>
              <Text type="supporting">Pending review</Text>
              <Heading level={2}>{pendingCount ?? "–"}</Heading>
              <Text type="supporting" color="secondary">
                across {reports.length || "–"} direct report{reports.length === 1 ? "" : "s"}
              </Text>
            </VStack>
          </Card>
          <Card variant="muted" width={260}>
            <VStack gap={1}>
              <Text type="supporting">Approved this month</Text>
              <Heading level={2}>{approvedThisMonth?.count ?? "–"}</Heading>
              <Text type="supporting" color="secondary">
                {approvedThisMonth ? formatCurrency(approvedThisMonth.total) : "switch to Approved to see totals"}
              </Text>
            </VStack>
          </Card>
        </HStack>

        <TabList value={tab} onChange={(v) => setTab(v as TabValue)}>
          {TABS.map((t) => (
            <Tab key={t} value={t} label={statusLabel(t)} />
          ))}
        </TabList>

        {error && (
          <Card variant="red">
            <Text>{error}</Text>
          </Card>
        )}

        {visibleRows === null ? (
          <Center height={200}>
            <Spinner size="lg" label="Loading claims..." />
          </Center>
        ) : visibleRows.length === 0 ? (
          <EmptyState title="Nothing here" description="No claims match this filter." />
        ) : (
          <Table
            data={visibleRows}
            idKey="id"
            hasHover
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
              {
                key: "status",
                header: "Status",
                width: proportional(1),
                renderCell: (row) => <Badge variant={statusBadgeVariant(row.status)} label={statusLabel(row.status)} />,
              },
              {
                key: "id",
                header: "",
                width: proportional(0.4),
                renderCell: (row) => (
                  <IconButton
                    label="Review claim"
                    icon={<Icon icon="chevronRight" />}
                    variant="ghost"
                    onClick={() => navigate(`/review/${row.id}`)}
                  />
                ),
              },
            ]}
          />
        )}
      </VStack>
    </Shell>
  );
}
