import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shell } from "../components/Shell";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
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

type TabValue = "All" | ClaimStatus;
const TABS: TabValue[] = ["All", "pending", "approved", "rejected"];

export default function MyClaims() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabValue>("All");
  const [rows, setRows] = useState<ExpenseClaimSummary[] | null>(null);
  const [counts, setCounts] = useState<{ pending: number; approved: number; rejected: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, pending, approved, rejected] = await Promise.all([
        listClaims({ status: tab === "All" ? undefined : tab, limit: 100 }),
        listClaims({ status: "pending", limit: 1 }),
        listClaims({ status: "approved", limit: 1 }),
        listClaims({ status: "rejected", limit: 1 }),
      ]);
      setRows(list.data);
      setCounts({ pending: pending.count, approved: approved.count, rejected: rejected.count });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load claims");
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Shell>
      <VStack gap={6}>
        <HStack justify="between" align="center">
          <Heading level={1}>My Claims</Heading>
          <Button label="New claim" variant="primary" onClick={() => navigate("/claims/new")} />
        </HStack>

        <HStack gap={4} wrap="wrap">
          <Card variant="muted" width={220}>
            <VStack gap={1}>
              <Text type="supporting">Pending</Text>
              <Heading level={2}>{counts?.pending ?? "–"}</Heading>
              <Text type="supporting" color="secondary">
                awaiting manager review
              </Text>
            </VStack>
          </Card>
          <Card variant="muted" width={220}>
            <VStack gap={1}>
              <Text type="supporting">Approved</Text>
              <Heading level={2}>{counts?.approved ?? "–"}</Heading>
              <Text type="supporting" color="secondary">
                ready for payroll
              </Text>
            </VStack>
          </Card>
          <Card variant="muted" width={220}>
            <VStack gap={1}>
              <Text type="supporting">Rejected</Text>
              <Heading level={2}>{counts?.rejected ?? "–"}</Heading>
              <Text type="supporting" color="secondary">
                needs your edits
              </Text>
            </VStack>
          </Card>
        </HStack>

        <TabList value={tab} onChange={(v) => setTab(v as TabValue)}>
          {TABS.map((t) => (
            <Tab key={t} value={t} label={t === "All" ? "All" : statusLabel(t)} />
          ))}
        </TabList>

        {error && (
          <Card variant="red">
            <Text color="primary">{error}</Text>
          </Card>
        )}

        {rows === null ? (
          <Center height={200}>
            <Spinner size="lg" label="Loading claims..." />
          </Center>
        ) : rows.length === 0 ? (
          <EmptyState title="No claims here yet" description="Submit a new claim to see it listed here." />
        ) : (
          <Table
            data={rows}
            idKey="id"
            hasHover
            columns={[
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
                key: "updatedAt",
                header: "Updated",
                width: proportional(1),
                renderCell: (row) => <Timestamp value={row.updatedAt} format="relative" />,
              },
              {
                key: "id",
                header: "",
                width: proportional(0.4),
                renderCell: (row) => (
                  <IconButton
                    label="View claim"
                    icon={<Icon icon="chevronRight" />}
                    variant="ghost"
                    onClick={() => navigate(`/claims/${row.id}`)}
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
