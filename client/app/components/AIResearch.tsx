import { useState, useEffect } from 'react';

interface ResearchFinding {
  id: string;
  category: 'roadmap' | 'tokenomics' | 'earning' | 'partnership' | 'development' | 'governance' | 'launch' | 'airdrop';
  title: string;
  description: string;
  source: {
    id: string;
    name: string;
    type: string;
    url: string;
    lastUpdated: Date;
    reliability: number;
    isOfficial: boolean;
  };
  date: Date;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  status: 'confirmed' | 'rumor' | 'speculation' | 'official';
  tags: string[];
  relatedFindings: string[];
}

interface TimelineEvent {
  date: Date;
  title: string;
  description: string;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'delayed';
  source: string;
}

interface ResearchResult {
  id: string;
  query: string;
  tokenId: string;
  summary: string;
  detailedAnalysis: string;
  sources: any[];
  findings: ResearchFinding[];
  confidence: number;
  lastUpdated: Date;
  metadata: {
    totalSources: number;
    officialSources: number;
    timeRange: string;
    keyTopics: string[];
  };
}

interface AIResearchProps {
  tokenId: string;
  tokenData: any;
}

export default function AIResearch({ tokenId, tokenData }: AIResearchProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [hasResearched, setHasResearched] = useState(false);

  const handleResearch = async () => {
    setIsLoading(true);
    setHasResearched(true);

    try {
      const response = await fetch(`http://localhost:8080/api/v1/ai-research/${tokenId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'roadmap, tokenomics, earning mechanisms, upcoming events, partnerships, development updates',
          sources: ['twitter', 'github', 'medium', 'reddit', 'news'],
          timeRange: '30d',
          includeHistorical: true,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('AI Research Response:', responseData);
        
        // Extract actual data from metadata if it exists
        const data = responseData.metadata || responseData;
        
        console.log('Extracted data:', data);
        console.log('Response has findings:', !!data.findings);
        console.log('Findings length:', data.findings?.length);
        console.log('Response has detailedAnalysis:', !!data.detailedAnalysis);
        console.log('DetailedAnalysis length:', data.detailedAnalysis?.length);
        
        setResearchResult(data);
      } else {
        console.error('Research failed with status:', response.status);
        throw new Error('Research failed');
      }
    } catch (error) {
      console.error('Error during research:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'official': return 'bg-blue-100 text-blue-800';
      case 'speculation': return 'bg-yellow-100 text-yellow-800';
      case 'rumor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'roadmap': return '🗺️';
      case 'tokenomics': return '💰';
      case 'earning': return '💎';
      case 'partnership': return '🤝';
      case 'development': return '🔧';
      case 'governance': return '🗳️';
      case 'launch': return '🚀';
      case 'airdrop': return '🎁';
      default: return '📄';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderDetailedAnalysis = () => {
    if (!researchResult) return null;

    const tokenType = getTokenType(tokenId);
    const tokenName = tokenData.name || tokenId.toUpperCase();
    const hasFindings = researchResult.findings && researchResult.findings.length > 0;

    return (
      <div className="space-y-6">
        {/* Detailed Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Tổng hợp mới nhất</h3>
          <div className="prose max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {researchResult.detailedAnalysis || researchResult.summary || 'Không có dữ liệu phân tích'}
            </div>
          </div>
        </div>

        {/* Show message if no findings */}
        {!hasFindings && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              ℹ️ Phân tích AI đã hoàn thành nhưng không tìm thấy findings chi tiết. Vui lòng xem phần tổng hợp ở trên.
            </p>
          </div>
        )}

        {/* Key Findings - Only show if has findings */}
        {hasFindings && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🔍 Key Findings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(researchResult.findings || []).slice(0, 9).map((finding, index) => (
              <div key={finding.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{finding.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    finding.source.type === 'ai' 
                      ? 'bg-purple-100 text-purple-800' 
                      : finding.source.isOfficial 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {finding.source.type === 'ai' ? 'AI' : finding.source.isOfficial ? 'Official' : 'Source'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{finding.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Confidence: {Math.round(finding.confidence * 100)}%</span>
                  <span className={`px-2 py-1 rounded ${
                    finding.impact === 'high' ? 'bg-red-100 text-red-800' :
                    finding.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {finding.impact}
                  </span>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}

        {/* Roadmap Section - Only show if has findings */}
        {hasFindings && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            📅 Các mốc kế hoạch và roadmap sắp tới
          </h3>
          <div className="space-y-4">
            {(researchResult.findings || [])
              .filter(f => f.category === 'roadmap')
              .slice(0, 5)
              .map((finding, index) => (
                <div key={finding.id} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    🔹 {finding.title}
                  </h4>
                  <p className="text-gray-700 mb-2">{finding.description}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{finding.source.name}</span>
                    <span>•</span>
                    <span>{formatDate(finding.date)}</span>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(finding.status)}`}>
                      {finding.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        )}

        {/* Tokenomics Section */}
        {hasFindings && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            💸 Tokenomics & Cơ chế {tokenName}
          </h3>
          <div className="space-y-4">
            {(researchResult.findings || [])
              .filter(f => f.category === 'tokenomics')
              .slice(0, 5)
              .map((finding, index) => (
                <div key={finding.id} className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    🔸 {finding.title}
                  </h4>
                  <p className="text-gray-700 mb-2">{finding.description}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{finding.source.name}</span>
                    <span>•</span>
                    <span>{formatDate(finding.date)}</span>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getImpactColor(finding.impact)}`}>
                      {finding.impact} impact
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        )}

        {/* Earning Opportunities */}
        {hasFindings && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            🎮 Các cơ hội kiếm {tokenName} mới
          </h3>
          <div className="space-y-4">
            {(researchResult.findings || [])
              .filter(f => f.category === 'earning')
              .slice(0, 6)
              .map((finding, index) => (
                <div key={finding.id} className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    💎 {finding.title}
                  </h4>
                  <p className="text-gray-700 mb-2">{finding.description}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{finding.source.name}</span>
                    <span>•</span>
                    <span>{formatDate(finding.date)}</span>
                    <span>•</span>
                    <span className="text-green-600 font-medium">
                      {Math.round(finding.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        )}

        {/* Development & Partnerships */}
        {hasFindings && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            🔧 Phát triển & Đối tác
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Development */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-lg">🛠️ Phát triển</h4>
              <div className="space-y-3">
                {(researchResult.findings || [])
                  .filter(f => f.category === 'development')
                  .slice(0, 3)
                  .map((finding, index) => (
                    <div key={finding.id} className="border-l-4 border-orange-500 pl-3">
                      <h5 className="font-medium text-gray-900 text-sm mb-1">{finding.title}</h5>
                      <p className="text-gray-600 text-xs mb-1">{finding.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{finding.source.name}</span>
                        <span>•</span>
                        <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(finding.status)}`}>
                          {finding.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Partnerships */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-lg">🤝 Đối tác</h4>
              <div className="space-y-3">
                {(researchResult.findings || [])
                  .filter(f => f.category === 'partnership')
                  .slice(0, 3)
                  .map((finding, index) => (
                    <div key={finding.id} className="border-l-4 border-pink-500 pl-3">
                      <h5 className="font-medium text-gray-900 text-sm mb-1">{finding.title}</h5>
                      <p className="text-gray-600 text-xs mb-1">{finding.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{finding.source.name}</span>
                        <span>•</span>
                        <span className={`px-1 py-0.5 rounded text-xs ${getImpactColor(finding.impact)}`}>
                          {finding.impact}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Governance & Airdrops */}
        {hasFindings && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            🗳️ Quản trị & Airdrop
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Governance */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-lg">🗳️ Quản trị</h4>
              <div className="space-y-3">
                {(researchResult.findings || [])
                  .filter(f => f.category === 'governance')
                  .slice(0, 3)
                  .map((finding, index) => (
                    <div key={finding.id} className="border-l-4 border-indigo-500 pl-3">
                      <h5 className="font-medium text-gray-900 text-sm mb-1">{finding.title}</h5>
                      <p className="text-gray-600 text-xs mb-1">{finding.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{finding.source.name}</span>
                        <span>•</span>
                        <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(finding.status)}`}>
                          {finding.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Airdrops */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-lg">🎁 Airdrop</h4>
              <div className="space-y-3">
                {(researchResult.findings || [])
                  .filter(f => f.category === 'airdrop')
                  .slice(0, 3)
                  .map((finding, index) => (
                    <div key={finding.id} className="border-l-4 border-yellow-500 pl-3">
                      <h5 className="font-medium text-gray-900 text-sm mb-1">{finding.title}</h5>
                      <p className="text-gray-600 text-xs mb-1">{finding.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{finding.source.name}</span>
                        <span>•</span>
                        <span className={`px-1 py-0.5 rounded text-xs ${getImpactColor(finding.impact)}`}>
                          {finding.impact}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Summary Table */}
        {hasFindings && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📌 Tóm tắt theo mục tiêu</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hạng mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Roadmap quan trọng
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {(researchResult.findings || [])
                      .filter(f => f.category === 'roadmap')
                      .slice(0, 3)
                      .map(f => f.title)
                      .join(', ')}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Tokenomics
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {(researchResult.findings || [])
                      .filter(f => f.category === 'tokenomics')
                      .slice(0, 2)
                      .map(f => f.title)
                      .join(', ')}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Nguồn kiếm {tokenName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {(researchResult.findings || [])
                      .filter(f => f.category === 'earning')
                      .slice(0, 3)
                      .map(f => f.title)
                      .join(', ')}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Phát triển & Đối tác
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {(researchResult.findings || [])
                      .filter(f => f.category === 'development' || f.category === 'partnership')
                      .slice(0, 3)
                      .map(f => f.title)
                      .join(', ')}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Quản trị & Airdrop
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {(researchResult.findings || [])
                      .filter(f => f.category === 'governance' || f.category === 'airdrop')
                      .slice(0, 2)
                      .map(f => f.title)
                      .join(', ')}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Thời gian tính năng
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    Các tính năng chính dự kiến ra mắt trong tháng 7-8/2025
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Sources */}
        {hasFindings && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🌐 Nguồn tham khảo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(researchResult.sources || []).slice(0, 12).map((source, index) => (
              <div key={source.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <span className={`w-2 h-2 rounded-full ${source.isOfficial ? 'bg-green-500' : source.type === 'ai' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                <span className="text-sm font-medium text-gray-900">{source.name}</span>
                {source.isOfficial && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Official</span>
                )}
                {source.type === 'ai' && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">AI</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>📊 Tổng cộng: <strong>{researchResult.metadata?.totalSources || 0}</strong> findings từ <strong>{(researchResult.sources || []).length}</strong> nguồn khác nhau</p>
            <p>✅ Nguồn chính thức: <strong>{researchResult.metadata?.officialSources || 0}</strong> sources</p>
            <p>🤖 AI Analysis: <strong>{(researchResult.sources || []).filter(s => s.type === 'ai').length}</strong> sources</p>
          </div>
        </div>
        )}

        {/* Conclusion */}
        {hasFindings && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">✅ Kết luận</h3>
          <div className="space-y-3">
            <p className="text-gray-700 leading-relaxed">
              Sắp tới (tháng 7–8/2025) có nhiều hoạt động quan trọng cho <strong>{tokenName}</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li><strong>Roadmap:</strong> {(researchResult.findings || [])
                .filter(f => f.category === 'roadmap')
                .slice(0, 3)
                .map(f => f.title)
                .join(', ') || 'N/A'}</li>
              <li><strong>Tokenomics:</strong> {(researchResult.findings || [])
                .filter(f => f.category === 'tokenomics')
                .slice(0, 2)
                .map(f => f.title)
                .join(', ') || 'N/A'}</li>
              <li><strong>Earning:</strong> {(researchResult.findings || [])
                .filter(f => f.category === 'earning')
                .slice(0, 3)
                .map(f => f.title)
                .join(', ') || 'N/A'}</li>
              <li><strong>Development:</strong> {(researchResult.findings || [])
                .filter(f => f.category === 'development')
                .slice(0, 2)
                .map(f => f.title)
                .join(', ')}</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              <strong>Khuyến nghị:</strong> Theo dõi các kênh chính thức và tham gia cộng đồng để cập nhật thông tin mới nhất về {tokenName}.
            </p>
          </div>
        </div>
        )}

        {/* Confidence Score */}
        {hasFindings && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Độ tin cậy nghiên cứu</span>
            <span className="text-sm text-gray-500">{Math.round(researchResult.confidence * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${researchResult.confidence * 100}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Dựa trên {researchResult.metadata.totalSources} nguồn ({researchResult.metadata.officialSources} chính thức)
          </div>
        </div>
        )}
      </div>
    );
  };

  const getTokenType = (tokenId: string): 'defi' | 'gaming' | 'infrastructure' | 'other' => {
    const defiTokens = ['uniswap', 'aave', 'compound', 'curve', 'sushi', 'yearn', 'balancer'];
    const gamingTokens = ['axs', 'sand', 'mana', 'enj', 'gala', 'ilv', 'hero'];
    const infrastructureTokens = ['eth', 'sol', 'ada', 'dot', 'avax', 'matic', 'link'];

    if (defiTokens.includes(tokenId.toLowerCase())) return 'defi';
    if (gamingTokens.includes(tokenId.toLowerCase())) return 'gaming';
    if (infrastructureTokens.includes(tokenId.toLowerCase())) return 'infrastructure';
    return 'other';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">🤖 AI Research Assistant</h3>
        <p className="text-sm text-gray-500 mt-1">
          Nghiên cứu toàn diện về {tokenData.name} roadmap, tokenomics, earning mechanisms và hơn thế nữa!
        </p>
      </div>

      <div className="p-6">
        {!hasResearched ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-lg font-medium mb-2">Nghiên cứu AI tự động</p>
            <p className="text-sm text-gray-600 mb-6">
              Nhấn nút Research để AI tự động phân tích và tổng hợp thông tin từ nhiều nguồn khác nhau
            </p>
            <button
              onClick={handleResearch}
              disabled={isLoading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang nghiên cứu...</span>
                </div>
              ) : (
                '🔍 Bắt đầu Research'
              )}
            </button>
            <div className="mt-4 text-xs text-gray-500">
              <p>AI sẽ phân tích:</p>
              <ul className="mt-2 space-y-1">
                <li>• Roadmap và kế hoạch sắp tới</li>
                <li>• Tokenomics và cơ chế token</li>
                <li>• Cơ hội kiếm tiền và earning</li>
                <li>• Partnerships và phát triển</li>
                <li>• Nguồn thông tin chính thức</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-900">Đang nghiên cứu...</p>
                <p className="text-sm text-gray-500 mt-2">AI đang phân tích dữ liệu từ nhiều nguồn</p>
              </div>
            ) : researchResult ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    📊 Báo cáo nghiên cứu {tokenData.name}
                  </h2>
                  <button
                    onClick={handleResearch}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>
                {renderDetailedAnalysis()}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">❌</div>
                <p className="text-lg font-medium text-gray-900 mb-2">Lỗi nghiên cứu</p>
                <p className="text-sm text-gray-500 mb-4">
                  Không thể tải dữ liệu nghiên cứu. Vui lòng thử lại.
                </p>
                <button
                  onClick={handleResearch}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Thử lại
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 