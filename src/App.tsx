import { SearchOutlined } from "@ant-design/icons";
import { Input, message, Typography } from "antd";
import { useState } from "react";
import "./App.css";
import { VirtualScroller } from "./VirtualScroller";

const { Search } = Input;
const { Title } = Typography;

interface SearchResult {
	id: number;
	name: string;
	parent_id: number;
}

export interface FlattenedResult {
	node: SearchResult;
	depth: number;
}

type ApiResponse = SearchResult[];

type FormattedMap = Map<number, SearchResult[]>;

function App() {
	const [flattenedResults, setFlattenedResults] = useState<FlattenedResult[]>(
		[]
	);
	const [loading, setLoading] = useState(false);

	// Search params
	const handleSearch = async (value: string) => {
		// If input is empty, do nothing
		if (!value) {
			return;
		}

		setLoading(true);

		try {
			const apiParams = new URLSearchParams();
			apiParams.set("query", value);

			const response = await fetch(
				`https://coursetreesearch-service-sandbox.dev.tophat.com/?${apiParams}`
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: ApiResponse = await response.json();
			if (data.length === 0) {
				message.warning(`No results found for "${value}"`);
			}
			handleFormatResponse(data);
		} catch (err) {
			console.error("Search error:", err);
			message.error("Something went wrong, please try again later");
			setFlattenedResults([]);
		} finally {
			setLoading(false);
		}
	};

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

		const result: FlattenedResult[] = [];
		const visited = new Set<number>();

		// Iterative DFS using
		const rootNodes = map.get(0) || [];
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

			const children = map.get(node.id) || [];

			for (let i = children.length - 1; i >= 0; i--) {
				if (!visited.has(children[i].id)) {
					stack.push({ node: children[i], depth: depth + 1 });
				}
			}
		}

		setFlattenedResults(result);
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
						onSearch={(e) => {
							setTimeout(() => handleSearch(e), 1000);
						}}
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
					<VirtualScroller flattenedResults={flattenedResults} />
				)}
			</div>
		</div>
	);
}

export default App;
