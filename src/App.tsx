import { SearchOutlined } from "@ant-design/icons";
import { Divider, Input, Typography, message } from "antd";
import { JSX, useState } from "react";
import "./App.css";

const { Search } = Input;
const { Title } = Typography;

interface SearchResult {
	id: number;
	name: string;
	parent_id: number;
}

type ApiResponse = SearchResult[];

type FormattedMap = Map<number, SearchResult[]>;

function App() {
	const [searchResults, setSearchResults] = useState<FormattedMap>(new Map());
	const [loading, setLoading] = useState(false);

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

	const RenderResultItemWithoutRecursion = (data: FormattedMap) => {
		// Iterative DFS to render items with cycle detection

		const result: JSX.Element[] = [];
		const visited = new Set<number>();

		// Iterative DFS using a stack
		const rootNodes = data.get(0) || [];
		const stack: { node: SearchResult; depth: number }[] = [];
		for (let i = 0; i < rootNodes.length; i++) {
			stack.push({ node: rootNodes[i], depth: 0 });
		}

		while (stack.length > 0) {
			const item = stack.shift();
			if (!item) continue;
			const { node, depth } = item;

			// Cycle detection: Skip if already visited
			if (visited.has(node.id)) {
				continue;
			}

			// Mark as visited
			visited.add(node.id);

			if (depth === 0) {
				result.push(<Divider key={`divider-${node.id}`} />);
			}

			result.push(
				<div key={node.id}>
					{"- ".repeat(depth)}
					{node.name}
				</div>
			);

			const children = data.get(node.id) || [];

			for (let i = children.length - 1; i >= 0; i--) {
				// Only add children that haven't been visited
				if (!visited.has(children[i].id)) {
					stack.unshift({ node: children[i], depth: depth + 1 });
				}
			}
		}

		return result;
	};

	return (
		<div style={{ minHeight: "100vh", paddingTop: "24px" }}>
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
				{!loading && searchResults.size > 0 && (
					<div>
						<div style={{ textAlign: "left" }}>
							{RenderResultItemWithoutRecursion(searchResults)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
