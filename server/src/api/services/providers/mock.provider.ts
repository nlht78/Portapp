/**
 * Mock Provider Implementation
 * Implements IAIProvider interface for testing and fallback scenarios
 */

import { BaseAIProvider } from './base.provider';
import {
  AIProviderConfig,
  AIProviderRequest,
  AIProviderResponse,
} from '../../interfaces/ai-provider.interface';

/**
 * Mock AI provider implementation
 * Always succeeds and returns mock data for testing and fallback scenarios
 */
export class MockProvider extends BaseAIProvider {
  private readonly DEFAULT_MODEL = 'mock-v1';

  constructor(config: AIProviderConfig) {
    // Mock provider doesn't need API key
    super({ ...config, apiKey: config.apiKey || 'mock-key' });
  }

  /**
   * Check if the provider is available
   * Mock provider is always available
   */
  public isAvailable(): boolean {
    return this.config.enabled;
  }

  /**
   * Generate a mock response
   * Always succeeds with generated mock data
   */
  public async generateResponse(
    request: AIProviderRequest
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();
    this.logRequest(request);

    // Simulate API delay
    await this.sleep(100);

    const content = this.generateMockContent(request);
    const tokensUsed = this.estimateTokens(request.prompt + (request.systemPrompt || ''));

    const aiResponse: AIProviderResponse = {
      content,
      provider: this.name,
      model: this.DEFAULT_MODEL,
      tokensUsed,
      responseTime: Date.now() - startTime,
      cached: false,
      metadata: {
        isMock: true,
        requestMetadata: request.metadata,
      },
    };

    this.logResponse(aiResponse, startTime);
    return aiResponse;
  }

  /**
   * Generate mock content based on the request
   */
  private generateMockContent(request: AIProviderRequest): string {
    const tokenId = this.extractTokenId(request);
    const tokenName = tokenId.toUpperCase();

    return `
# Phân tích ${tokenName} (Mock Data)

⚠️ **Lưu ý**: Đây là dữ liệu mock được tạo tự động. Vui lòng cấu hình API key cho OpenAI hoặc Anthropic để nhận phân tích AI thực sự.

## 📅 ROADMAP & KẾ HOẠCH SẮP TỚI

🔹 **Phát triển Ecosystem**: ${tokenName} đang mở rộng hệ sinh thái với các tính năng mới và đối tác chiến lược.

🔹 **Cập nhật Protocol**: Nâng cấp giao thức để cải thiện hiệu suất và khả năng mở rộng.

🔹 **Tích hợp Cross-chain**: Hỗ trợ tích hợp với nhiều blockchain khác nhau.

## 💸 TOKENOMICS & CƠ CHẾ TOKEN

🔹 **Staking Rewards**: Cơ chế staking với APY cạnh tranh cho holders.

🔹 **Token Distribution**: Phân phối token theo lộ trình minh bạch.

🔹 **Governance Rights**: Quyền quản trị cho token holders.

## 🎮 CƠ HỘI KIẾM TIỀN

🔹 **Staking**: Stake token để nhận phần thưởng thụ động.

🔹 **Liquidity Mining**: Cung cấp thanh khoản để nhận rewards.

🔹 **Yield Farming**: Tham gia các pool farming với APY hấp dẫn.

## 🔧 PHÁT TRIỂN & ĐỐI TÁC

🔹 **Technical Updates**: Cập nhật kỹ thuật thường xuyên từ đội ngũ phát triển.

🔹 **Strategic Partnerships**: Hợp tác với các dự án và tổ chức hàng đầu.

🔹 **Developer Ecosystem**: Xây dựng cộng đồng developer mạnh mẽ.

## 🗳️ QUẢN TRỊ & AIRDROP

🔹 **Governance Proposals**: Đề xuất và bỏ phiếu cho các quyết định quan trọng.

🔹 **Community Voting**: Tham gia voting để định hướng dự án.

🔹 **Airdrop Events**: Các sự kiện airdrop cho community members.

## ✅ KẾT LUẬN

${tokenName} đang trong giai đoạn phát triển tích cực với nhiều cơ hội cho investors và users. Tuy nhiên, đây là dữ liệu mock và cần được xác minh với nguồn thông tin chính thức.

**Khuyến nghị**: 
- Theo dõi các kênh thông tin chính thức
- Tham gia cộng đồng để cập nhật tin tức
- Nghiên cứu kỹ trước khi đầu tư
- Cấu hình API key để nhận phân tích AI thực sự
`;
  }

  /**
   * Extract token ID from request metadata or prompt
   */
  private extractTokenId(request: AIProviderRequest): string {
    // Try to get from metadata
    if (request.metadata?.tokenId) {
      return request.metadata.tokenId;
    }

    // Try to extract from prompt
    const promptLower = request.prompt.toLowerCase();
    const commonTokens = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'axs', 'sand', 'mana',
      'uniswap', 'aave', 'compound', 'solana', 'sol', 'cardano', 'ada'
    ];

    for (const token of commonTokens) {
      if (promptLower.includes(token)) {
        return token;
      }
    }

    return 'token';
  }

  /**
   * Estimate token count from text
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate mock response
   * Mock responses are always valid
   */
  public validateResponse(response: any): boolean {
    return super.validateResponse(response);
  }

  /**
   * Estimate cost for mock provider
   * Mock provider has no cost
   */
  public estimateCost(tokensUsed: number): number {
    return 0;
  }

  /**
   * Override validateConfig to not require API key
   */
  protected validateConfig(): void {
    if (!this.config.name) {
      throw new Error('Provider name is required');
    }
    if (this.config.priority === undefined || this.config.priority < 0) {
      throw new Error(`[${this.name}] Priority must be a non-negative number`);
    }
  }
}
