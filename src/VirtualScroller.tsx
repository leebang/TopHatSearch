import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import { useRef } from "react";
import { FlattenedResult } from "./App";

export const VirtualScroller = ({
	flattenedResults,
}: {
	flattenedResults: FlattenedResult[];
}) => {
	// Ref for scroll container
	const parentRef = useRef<HTMLDivElement>(null);

	// Virtualizer, only render what user see
	const rowVirtualizer = useVirtualizer({
		count: flattenedResults.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 35,
		overscan: 5,
	});

	// Render individual items
	const renderVirtualItem = (virtualItem: VirtualItem) => {
		const item = flattenedResults[virtualItem.index];
		if (!item) return null;

		const { node, depth } = item;

		return (
			<div
				key={virtualItem.key}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: `${virtualItem.size}px`,
					transform: `translateY(${virtualItem.start}px)`,
					display: "flex",
					alignItems: "center",
					padding: "4px 0",
				}}
			>
				{"- ".repeat(depth)}
				{node.name}
			</div>
		);
	};

	return (
		<div
			ref={parentRef}
			style={{
				height: "600px",
				overflow: "auto",
				border: "1px solid #f0f0f0",
				borderRadius: "6px",
				padding: "8px",
			}}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
				}}
			>
				{rowVirtualizer.getVirtualItems().map(renderVirtualItem)}
			</div>
		</div>
	);
};
