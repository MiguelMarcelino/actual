// @ts-strict-ignore
import React, { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { AlignedText } from '@actual-app/components/aligned-text';
import { theme } from '@actual-app/components/theme';
import { css } from '@emotion/css';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts';

import {
  amountToCurrency,
  amountToCurrencyNoDecimal,
} from 'loot-core/shared/util';
import {
  type balanceTypeOpType,
  type DataEntity,
  type RuleConditionEntity,
} from 'loot-core/types/models';

import { adjustTextSize } from './adjustTextSize';
import { renderCustomLabel } from './renderCustomLabel';
import { showActivity } from './showActivity';

import { Container } from '@desktop-client/components/reports/Container';
import { getCustomTick } from '@desktop-client/components/reports/getCustomTick';
import { numberFormatterTooltip } from '@desktop-client/components/reports/numberFormatter';
import { useAccounts } from '@desktop-client/hooks/useAccounts';
import { useCategories } from '@desktop-client/hooks/useCategories';
import { useNavigate } from '@desktop-client/hooks/useNavigate';
import { usePrivacyMode } from '@desktop-client/hooks/usePrivacyMode';

type PayloadChild = {
  props: {
    name: string;
    fill: string;
  };
};

type PayloadItem = {
  payload: {
    name: string;
    totalAssets: number;
    totalDebts: number;
    netAssets: number;
    netDebts: number;
    totalTotals: number;
    networth: number;
    totalChange: number;
    children: [PayloadChild];
  };
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: PayloadItem[];
  balanceTypeOp?: balanceTypeOpType;
  yAxis?: string;
};

const CustomTooltip = ({
  active,
  payload,
  balanceTypeOp,
  yAxis,
}: CustomTooltipProps) => {
  const { t } = useTranslation();

  if (active && payload && payload.length) {
    return (
      <div
        className={css({
          zIndex: 1000,
          pointerEvents: 'none',
          borderRadius: 2,
          boxShadow: '0 1px 6px rgba(0, 0, 0, .20)',
          backgroundColor: theme.menuBackground,
          color: theme.menuItemText,
          padding: 10,
        })}
      >
        <div>
          <div style={{ marginBottom: 10 }}>
            <strong>{payload[0].payload[yAxis]}</strong>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            {['totalAssets', 'totalTotals'].includes(balanceTypeOp) && (
              <AlignedText
                left={t('Assets:')}
                right={amountToCurrency(payload[0].payload.totalAssets)}
              />
            )}
            {['totalDebts', 'totalTotals'].includes(balanceTypeOp) && (
              <AlignedText
                left={t('Debts:')}
                right={amountToCurrency(payload[0].payload.totalDebts)}
              />
            )}
            {['netAssets'].includes(balanceTypeOp) && (
              <AlignedText
                left={t('Net Assets:')}
                right={amountToCurrency(payload[0].payload.netAssets)}
              />
            )}
            {['netDebts'].includes(balanceTypeOp) && (
              <AlignedText
                left={t('Net Debts:')}
                right={amountToCurrency(payload[0].payload.netDebts)}
              />
            )}
            {['totalTotals'].includes(balanceTypeOp) && (
              <AlignedText
                left={t('Net:')}
                right={
                  <strong>
                    {amountToCurrency(payload[0].payload.totalTotals)}
                  </strong>
                }
              />
            )}
          </div>
        </div>
      </div>
    );
  }
};

const customLabel = (props, typeOp) => {
  const calcX = props.x + props.width / 2;
  const calcY = props.y - (props.value > 0 ? 15 : -15);
  const textAnchor = 'middle';
  const display =
    props.value !== 0 && `${amountToCurrencyNoDecimal(props.value)}`;
  const textSize = adjustTextSize({
    sized: props.width,
    type: typeOp === 'totalTotals' ? 'default' : 'variable',
    values: props.value,
  });

  return renderCustomLabel(calcX, calcY, textAnchor, display, textSize);
};

type BarGraphProps = {
  style?: CSSProperties;
  data: DataEntity;
  filters: RuleConditionEntity[];
  groupBy: string;
  balanceTypeOp: balanceTypeOpType;
  compact?: boolean;
  viewLabels: boolean;
  showHiddenCategories?: boolean;
  showOffBudget?: boolean;
  showTooltip?: boolean;
};

export function BarGraph({
  style,
  data,
  filters,
  groupBy,
  balanceTypeOp,
  compact,
  viewLabels,
  showHiddenCategories,
  showOffBudget,
  showTooltip = true,
}: BarGraphProps) {
  const navigate = useNavigate();
  const categories = useCategories();
  const accounts = useAccounts();
  const privacyMode = usePrivacyMode();
  const [pointer, setPointer] = useState('');

  const yAxis = groupBy === 'Interval' ? 'date' : 'name';
  const splitData = groupBy === 'Interval' ? 'intervalData' : 'data';
  const labelsMargin = viewLabels ? 30 : 0;

  const getVal = obj => {
    if (['totalDebts', 'netDebts'].includes(balanceTypeOp)) {
      return -1 * obj[balanceTypeOp];
    }

    return obj[balanceTypeOp];
  };

  const longestLabelLength = data[splitData]
    .map(c => c[yAxis])
    .reduce((acc, cur) => (cur.length > acc ? cur.length : acc), 0);

  const largestValue = data[splitData]
    .map(c => c[balanceTypeOp])
    .reduce((acc, cur) => (Math.abs(cur) > Math.abs(acc) ? cur : acc), 0);

  const leftMargin = Math.abs(largestValue) > 1000000 ? 20 : 0;

  return (
    <Container
      style={{
        ...style,
        ...(compact && { height: 'auto' }),
      }}
    >
      {(width, height) =>
        data[splitData] && (
          <ResponsiveContainer>
            <div>
              {!compact && <div style={{ marginTop: '15px' }} />}
              <BarChart
                width={width}
                height={height}
                stackOffset="sign"
                data={data[splitData]}
                style={{ cursor: pointer }}
                margin={{
                  top: labelsMargin,
                  right: 0,
                  left: leftMargin,
                  bottom: 0,
                }}
              >
                {showTooltip && (
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={
                      <CustomTooltip
                        balanceTypeOp={balanceTypeOp}
                        yAxis={yAxis}
                      />
                    }
                    formatter={numberFormatterTooltip}
                    isAnimationActive={false}
                  />
                )}
                {!compact && <CartesianGrid strokeDasharray="3 3" />}
                {!compact && (
                  <XAxis
                    dataKey={yAxis}
                    angle={-35}
                    textAnchor="end"
                    height={Math.sqrt(longestLabelLength) * 25}
                    tick={{ fill: theme.pageText }}
                    tickLine={{ stroke: theme.pageText }}
                  />
                )}
                {!compact && (
                  <YAxis
                    tickFormatter={value =>
                      getCustomTick(
                        amountToCurrencyNoDecimal(value),
                        privacyMode,
                      )
                    }
                    tick={{ fill: theme.pageText }}
                    tickLine={{ stroke: theme.pageText }}
                    tickSize={0}
                  />
                )}
                {!compact && (
                  <ReferenceLine y={0} stroke={theme.pageTextLight} />
                )}
                <Bar
                  dataKey={val => getVal(val)}
                  stackId="a"
                  onMouseLeave={() => setPointer('')}
                  onMouseEnter={() =>
                    !['Group', 'Interval'].includes(groupBy) &&
                    setPointer('pointer')
                  }
                  onClick={item =>
                    ((compact && showTooltip) || !compact) &&
                    !['Group', 'Interval'].includes(groupBy) &&
                    showActivity({
                      navigate,
                      categories,
                      accounts,
                      balanceTypeOp,
                      filters,
                      showHiddenCategories,
                      showOffBudget,
                      type: 'totals',
                      startDate: data.startDate,
                      endDate: data.endDate,
                      field: groupBy.toLowerCase(),
                      id: item.id,
                    })
                  }
                >
                  {viewLabels && !compact && (
                    <LabelList
                      dataKey={val => getVal(val)}
                      content={e => customLabel(e, balanceTypeOp)}
                    />
                  )}
                  {data.legend.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      name={entry.name}
                    />
                  ))}
                </Bar>
              </BarChart>
            </div>
          </ResponsiveContainer>
        )
      }
    </Container>
  );
}
