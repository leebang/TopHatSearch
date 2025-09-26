import { SearchOutlined } from "@ant-design/icons";
import { Input, Typography, message } from "antd";
import { useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import "./App.css";

const { Search } = Input;
const { Title } = Typography;

interface SearchResult {
	id: number;
	name: string;
	parent_id: number;
}

interface FlattenedResult {
	node: SearchResult;
	depth: number;
}

type ApiResponse = SearchResult[];

type FormattedMap = Map<number, SearchResult[]>;

function App() {
	const [searchResults, setSearchResults] = useState<FormattedMap>(new Map());
	const [loading, setLoading] = useState(false);

	// Ref for scroll container
	const parentRef = useRef<HTMLDivElement>(null);

	// Format the API response into a map
	const handleFormatResponse = (data: ApiResponse) => {
		const map: FormattedMap = new Map();

		data.forEach((item) => {
			const existing = map.get(item.parent_id);

			if (existing) {
				existing.push(item);
			} else {
				map.set(item.parent_id, [item]);
			}
		});

		// Sort all arrays by id in ascending order
		map.forEach((items) => {
			items.sort((a, b) => a.id - b.id);
		});

		return map;
	};

	const handleSearch = async (value: string) => {
		// If input is empty, do nothing
		if (!value) {
			return;
		}

		setLoading(true);

		try {
			const response = await fetch(
				`https://coursetreesearch-service-sandbox.dev.tophat.com/?query=${encodeURIComponent(
					value
				)}`
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: ApiResponse = await response.json();
			const formattedMap = handleFormatResponse(data);
			setSearchResults(formattedMap);

			// Show message if no results found
			if (formattedMap.size === 0) {
				message.warning(`No results found for "${value}"`);
			}
		} catch (err) {
			console.error("Search error:", err);
			message.error("Something went wrong, please try again later");
			setSearchResults(new Map());
		} finally {
			setLoading(false);
		}
	};

	// Flatten the tree structure into a linear array
	const getFlattenedResults = () => {
		if (searchResults.size === 0) return [];

		const result: FlattenedResult[] = [];
		const visited = new Set<number>();

		// Iterative DFS using
		const rootNodes = searchResults.get(0) || [];
		const stack: { node: SearchResult; depth: number }[] = [];

		for (let i = rootNodes.length - 1; i >= 0; i--) {
			stack.push({ node: rootNodes[i], depth: 0 });
		}

		while (stack.length > 0) {
			const item = stack.pop();
			if (!item) continue;
			const { node, depth } = item;

			// Cycle detection: Skip if already visited
			if (visited.has(node.id)) {
				continue;
			}

			// Mark as visited
			visited.add(node.id);

			result.push({ node, depth });

			const children = searchResults.get(node.id) || [];

			for (let i = children.length - 1; i >= 0; i--) {
				if (!visited.has(children[i].id)) {
					stack.push({ node: children[i], depth: depth + 1 });
				}
			}
		}

		return result;
	};

	const flattenedResults = getFlattenedResults();

	// Virtualizer, only render what user see
	const rowVirtualizer = useVirtualizer({
		count: flattenedResults.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 35,
		overscan: 5,
	});

	// Render individual items
	const renderVirtualItem = (virtualItem: any) => {
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
		<div style={{ minHeight: "80vh", paddingTop: "24px" }}>
			<div
				style={{
					backgroundColor: "white",
					padding: "24px",
					marginBottom: "24px",
				}}
			>
				<div style={{ width: "800px", margin: "0 auto" }}>
					<Title
						level={2}
						style={{ textAlign: "center", marginBottom: "24px" }}
					>
						Top Hat Course
					</Title>

					<Search
						placeholder="Search for courses"
						enterButton={<SearchOutlined />}
						size="large"
						onSearch={handleSearch}
						loading={loading}
					/>
				</div>
			</div>

			<div
				style={{
					width: "800px",
					margin: "0 auto",
					padding: "0 24px",
				}}
			>
				{!loading && flattenedResults.length > 0 && (
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
				)}
			</div>
		</div>
	);
}

export default App;
