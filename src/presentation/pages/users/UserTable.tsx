import { DataTable } from '../../components/DataTable'
import type { UserRow } from '../../models/rows'

interface UserTableProps {
  rows: UserRow[]
  emptyMessage: string
  emptyHint?: string
}

/** 상세 페이지가 없어 행 클릭 동작을 두지 않는다. */
export function UserTable({ rows, emptyMessage, emptyHint }: UserTableProps) {
  return (
    <DataTable
      rows={rows}
      rowKey={(row) => row.id}
      emptyMessage={emptyMessage}
      emptyHint={emptyHint}
      columns={[
        {
          key: 'id',
          header: '유저 ID',
          width: '300px',
          render: (row) => <span className="or-cell-id">{row.id}</span>,
        },
        {
          key: 'name',
          header: '이름',
          width: '160px',
          render: (row) => row.name,
        },
        {
          key: 'createdAt',
          header: '가입일',
          width: '140px',
          render: (row) => <span className="or-cell-muted">{row.createdAt}</span>,
        },
        {
          key: 'missionCount',
          header: '미션 수',
          width: '100px',
          align: 'right',
          render: (row) => row.missionCount,
        },
      ]}
    />
  )
}
