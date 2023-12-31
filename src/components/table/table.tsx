import React, { FC, useEffect, useMemo, useState } from 'react';
import { usePagination } from '../../hooks/use-pagination';
import { getNestedValues, sortData } from './utils';
import { LuSearch, LuDownload, LuMoreVertical, LuChevronDown, LuChevronUp, LuMoveLeft, LuMoveRight } from 'react-icons/lu';
import { Menu } from '@headlessui/react';
import { Button } from '../button/button';

export interface TableProps {
    columns: Array<TableColumn>
    data: Array<any>
    isLoading?: boolean
    emptyDataText?: string
    rowsPerPage?: number
    searchable?: boolean
    fixed?: boolean
    viewOnly?: boolean
}

export enum ETableColumnOrder {
    Asc = 'asc',
    Desc = 'desc'
}

export interface TableColumn {
    exportFormatter?: (value: any) => any
    visible?: boolean
    name: string
    key: string[]
    sortable?: boolean
    sortableOrder?: ETableColumnOrder
    formatter?: (value: any) => unknown,
    events?: { onClick: () => unknown }
}

const getValue = (column: TableColumn, item: any): string | null => {
    if (column.formatter) return column.formatter(item) as string;
    return getNestedValues(column.key, item) as string;
}

export const Table: FC<TableProps> = ({
    columns,
    data = [],
    emptyDataText,
    isLoading = false,
    rowsPerPage = 10,
    searchable = false,
    fixed = false,
    viewOnly = false
}: TableProps) => {
    const [innerColumns, setInnerColumns] = useState(columns);
    const [innerData, setInnerData] = useState(data);
    const [itemsPerPage, setItemsPerPage] = useState(rowsPerPage);
    const {
        pagination,
        currentPage,
        startIndex,
        endIndex,
        handlePreviousPage,
        handleNextPage,
        handlePageChange
    } = usePagination(innerData, itemsPerPage);
    const emptyText = emptyDataText ? emptyDataText : 'Não existem dados para exibição';
    const handleSortData = (column: TableColumn) => {
        if (column.sortable) {
            const order = column.sortableOrder === ETableColumnOrder.Asc ? ETableColumnOrder.Desc : ETableColumnOrder.Asc;
            const sortedData = sortData(column.key, innerData, order);
            const sortedColumns = (columns.map(col => {
                if (col.key.toString() === column.key.toString()) col.sortableOrder = order;
                if (col.key.toString() !== column.key.toString()) col.sortableOrder = undefined;
                return col;
            }));

            setInnerColumns(sortedColumns);
            setInnerData(sortedData);
        }
        return undefined;
    };
    const handleFilterData = (data: any[], search: string) => {
        const length = data.length;
        const results: any[] = [];
        search = search.toLowerCase().trim();

        for (let i = 0; i < length; i++) {
            const values = Object.values(data[i]).join(' ').toLowerCase();
            if (values.includes(search)) results.push(data[i]);
        }

        const sortedColumn = innerColumns.find(x => x.sortableOrder);

        if (sortedColumn) {
            const sortedData = sortData(sortedColumn.key, results, sortedColumn.sortableOrder!);
            setInnerData(sortedData);
            return;
        }

        setInnerData(results);
    }
    const [searchValue, setSearchValue] = useState('');

    useEffect(() => setInnerColumns(columns), [columns]);
    useEffect(() => handleFilterData(data, searchValue), [data]);

    return (
        <div className=" w-full bg-white my-4 rounded-lg py-4 border">
            {!viewOnly &&
                <div className="w-full flex space-x-4 justify-end mb-4 px-4">
                    <div className="w-full flex space-x-4 items-center justify-end flex-col md:flex-row">
                        <div className="w-full flex-1 my-4 md:my-0">
                            {(searchable && !isLoading) &&
                                <div className="relative flex-1 max-w-sm">
                                    <LuSearch className="absolute top-2.5 left-2 text-gray-300" size={20} />
                                    <input
                                        type="text"
                                        id="search-input"
                                        placeholder="Pesquisar"
                                        className="border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2 pl-8 pr-4 outline-none"
                                        value={searchValue}
                                        onChange={(e) => {
                                            setSearchValue(e.target.value);
                                            handleFilterData(data, e.target.value);
                                        }}
                                    />
                                </div>
                            }
                        </div>
                        {!isLoading && innerData.length > 0 &&
                            <div className="w-full flex items-center space-x-4 justify-between -order-1 md:order-1 md:justify-normal md:w-min">
                                <div className="flex flex-nowrap items-center space-x-2 text-sm text-gray-400">
                                    <span className="whitespace-nowrap">Exibindo</span>
                                    <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))} className="bg-green-50 border border-green-300 text-green-700 font-medium text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2 outline-none">
                                        <option value={10} title="10 itens por página">10</option>
                                        <option value={50} title="50 itens por página">50</option>
                                        <option value={75} title="75 itens por página">75</option>
                                        <option value={100} title="100 itens por página">100</option>
                                    </select>
                                    <span className="whitespace-nowrap">de {innerData.length} resultados</span>
                                </div>
                                <div className="relative">
                                    <Menu>
                                        <Menu.Button className="px-2 py-2 text-sm font-medium text-center flex items-center rounded-lg border border-transparent hover:border-gray-200">
                                            <LuMoreVertical />
                                        </Menu.Button>
                                        <Menu.Items className="flex flex-col absolute right-0 top-8 bg-white shadow-md border rounded-xl p-4">
                                            <Menu.Item>
                                                <button onClick={() => { }} type="button" className="px-3 py-2 text-sm font-medium text-center flex items-center">
                                                    <LuDownload className="mr-2" /> Exportar
                                                </button>
                                            </Menu.Item>
                                        </Menu.Items>
                                    </Menu>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            }
            <div className="w-full overflow-x-auto">
                <table className={`w-full text-sm text-left text-gray-500 ${fixed ?? 'table-fixed'}`}>
                    <thead className="text-green-700 capitalize bg-green-50 whitespace-nowrap">
                        <tr>
                            {innerColumns.map((column, index) => {
                                if (column.visible !== false) {
                                    return (
                                        <th key={index} scope="col" className="py-3 px-6 whitespace-nowrap" onClick={column.sortable ? () => handleSortData(column) : undefined}>
                                            <div className="flex items-center justify-between space-x-4">
                                                <span>{column.name}</span>
                                                {column.sortable &&
                                                    <div className="flex flex-col items-center justify-around">
                                                        <LuChevronUp size={16} className={column.sortableOrder === 'asc' ? 'text-green-700' : 'text-gray-300'} />
                                                        <LuChevronDown size={16} className={column.sortableOrder === 'desc' ? '-mt-1.5 text-green-700' : '-mt-1.5 text-gray-300'} />
                                                    </div>
                                                }
                                            </div>
                                        </th>
                                    );
                                }
                                return null;
                            })}
                        </tr>
                    </thead>
                    <tbody className="overflow-y-auto">
                        {!isLoading &&
                            innerData.slice(startIndex, endIndex).map((item: any, rowIndex: number) => {
                                return (
                                    <tr key={rowIndex} className="hover:bg-green-50 [&:not(:last-child)]:border-b">
                                        {
                                            innerColumns.map((column, colIndex) => {
                                                if (column.visible !== false) {
                                                    if (colIndex === 0) {
                                                        return (
                                                            <td
                                                                scope="row"
                                                                key={colIndex}
                                                                className={`relative ${getValue(column, item) ? 'py-4 px-6 whitespace-nowrap hover:bg-green-100' : 'py-4 px-6 whitespace-nowrap hover:bg-green-100 before:content-["(vazio)"] text-gray-300'}`}
                                                            >
                                                                <span>
                                                                    {getValue(column, item)}
                                                                </span>
                                                            </td>
                                                        );
                                                    }
                                                    return (
                                                        <td
                                                            key={colIndex}
                                                            className={`relative ${getValue(column, item) ? 'py-4 px-6 whitespace-nowrap hover:bg-green-100' : 'py-4 px-6 whitespace-nowrap hover:bg-green-100 before:content-["(vazio)"] text-gray-300'}`}
                                                        >
                                                            <span>
                                                                {getValue(column, item)}
                                                            </span>
                                                        </td>
                                                    );
                                                }
                                                return null;
                                            })
                                        }
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
                {isLoading &&
                    <div className="w-full flex justify-center mt-4 text-sm">
                        <p className="text-gray-500">Carregando...</p>
                    </div>
                }
                {(!isLoading && innerData.length <= 0) &&
                    <div className="w-full flex justify-center mt-4 text-sm">
                        <p className="text-gray-500">{emptyText}</p>
                    </div>
                }
            </div>
            {(!isLoading && innerData.length > itemsPerPage) &&
                <nav className="w-full flex justify-end mt-6 px-4">
                    <div className="w-full inline-flex space-x-4 justify-between items-center">
                        <Button
                            _type="outlined"
                            className=""
                            leadingIcon={<LuMoveLeft />}
                            label="Anterior"
                            onClick={handlePreviousPage}
                        />
                        <div className="flex items-center space-x-2">
                            {pagination.map((page: number | string, index: number) => (
                                <Button
                                    key={index}
                                    _type="text"
                                    label={page.toString()}
                                    className={page === currentPage ? 'text-white border-none bg-green-600 hover:bg-green-700 hover:text-white' : 'border-none'}
                                    onClick={typeof page === 'number' ? () => handlePageChange(page) : undefined}
                                />
                            ))}
                        </div>
                        <Button
                            _type="outlined"
                            className=""
                            trailingIcon={<LuMoveRight />}
                            label="Próximo"
                            onClick={handleNextPage}
                        />
                    </div>
                </nav>
            }
        </div>
    );
};