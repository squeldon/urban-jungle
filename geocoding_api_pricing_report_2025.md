# Geocoding API Pricing Comparison Report - 2025
## For Real Estate Platform: Wholesaler-Buyer Connection Service

### Executive Summary

This report analyzes geocoding API pricing for a real estate platform connecting wholesalers to buyers, with usage patterns including:
- Users searching properties by location
- Property pins displayed on maps
- Geographical boundary overlays
- No autocomplete/predictive text features
- Estimated 5 geocoding requests per active user per day

---

## Complete API Comparison Table

| Provider | Free Tier | Paid Plans | Cost per 1K Requests | Rate Limits | Best For |
|----------|-----------|------------|---------------------|-------------|----------|
| **HERE Maps** | 250,000/month | €0.60/1K up to 5M | €0.60 ($0.66) | 5 QPS free | High volume |
| **Mapbox** | 100,000/month | $0.75/1K (temp) | $0.75-$5.00 | 1,000/min (16.7 QPS) | Mid-high volume |
| **Geoapify** | 3,000/day (90K/month) | $59/month for 10K/day | $1.97/1K | 5 QPS free | Steady daily usage |
| **OpenCage** | 2,500/day (75K/month) | €50/month for 10K/day | €1.67/1K ($1.83) | 1 QPS free | EU-friendly |
| **Google Maps** | $200 credit (40K requests) | $4-5/1K | $4.00-$5.00 | 50 QPS | Enterprise features |
| **PositionStack** | 25,000/month | $9.99/month for 100K | $0.10/1K | Moderate | Budget option |
| **Radar** | Unknown | $0.50/1K | $0.50 | Unknown | Cost-effective |
| **Geocodio** | 2,500/day | $0.50/1K | $0.50 | 16.7 QPS | US-focused |
| **LocationIQ** | 5,000/day | $39/month for 100K | $0.39/1K | Variable | Budget alternative |

---

## Free Tier User Support Analysis

**Assumptions:** 5 geocoding requests per user per day

| Provider | Free Requests | Users Supported (Daily) | Users Supported (Monthly) |
|----------|---------------|------------------------|---------------------------|
| **HERE Maps** | 250,000/month | ~1,667 | ~1,667 |
| **Mapbox** | 100,000/month | ~667 | ~667 |
| **Geoapify** | 3,000/day | 600 | 600 |
| **OpenCage** | 2,500/day | 500 | 500 |
| **Google Maps** | 40,000/month | ~267 | ~267 |
| **PositionStack** | 25,000/month | ~167 | ~167 |
| **LocationIQ** | 5,000/day | 1,000 | 1,000 |
| **Geocodio** | 2,500/day | 500 | 500 |

---

## Cost Projections by User Volume

### Small Scale (100 active users/day = 15,000 requests/month)

| Provider | Monthly Cost | Annual Cost | Notes |
|----------|-------------|-------------|--------|
| HERE Maps | **FREE** | **FREE** | Well within free tier |
| Mapbox | **FREE** | **FREE** | Well within free tier |
| Geoapify | **FREE** | **FREE** | Well within free tier |
| All others | **FREE** | **FREE** | All can handle this volume |

### Medium Scale (1,000 active users/day = 150,000 requests/month)

| Provider | Monthly Cost | Annual Cost | Cost per User/Month |
|----------|-------------|-------------|-------------------|
| HERE Maps | **FREE** | **FREE** | $0.00 |
| Radar | $75 | $900 | $0.075 |
| Geocodio | $75 | $900 | $0.075 |
| LocationIQ | $39 | $468 | $0.039 |
| PositionStack | $49.99 | $600 | $0.050 |
| Mapbox | $37.50 | $450 | $0.038 |
| Geoapify | $295* | $3,540 | $0.295 |
| Google Maps | $550 | $6,600 | $0.550 |

*Geoapify requires highest tier for this volume

### Large Scale (5,000 active users/day = 750,000 requests/month)

| Provider | Monthly Cost | Annual Cost | Cost per User/Month |
|----------|-------------|-------------|-------------------|
| HERE Maps | $396 | $4,752 | $0.079 |
| Radar | $375 | $4,500 | $0.075 |
| Geocodio | $375 | $4,500 | $0.075 |
| LocationIQ | $234* | $2,808 | $0.047 |
| PositionStack | $49.99 | $600 | $0.010 |
| Mapbox | $487.50 | $5,850 | $0.098 |
| Geoapify | $537* | $6,444 | $0.107 |
| Google Maps | $3,000 | $36,000 | $0.600 |

*Estimated based on available pricing tiers

### Enterprise Scale (20,000 active users/day = 3,000,000 requests/month)

| Provider | Monthly Cost | Annual Cost | Cost per User/Month |
|----------|-------------|-------------|-------------------|
| HERE Maps | $1,440 | $17,280 | $0.072 |
| Radar | $1,500 | $18,000 | $0.075 |
| Geocodio | $1,500 | $18,000 | $0.075 |
| PositionStack | $99.99 | $1,200 | $0.005 |
| Mapbox | $1,800+ | $21,600+ | $0.090+ |
| Google Maps | $12,000 | $144,000 | $0.600 |

---

## Specific Recommendations by Business Stage

### **Startup Phase (0-500 users/day)**
**Recommended: HERE Maps or Mapbox**
- HERE Maps: Most generous free tier (250K requests/month)
- Mapbox: Strong free tier with excellent mapping features
- Both provide room for growth without immediate costs

### **Growth Phase (500-2,000 users/day)**
**Recommended: LocationIQ or PositionStack**
- LocationIQ: $39/month for up to 100K requests
- PositionStack: Excellent value at higher volumes
- Both offer predictable pricing

### **Scale Phase (2,000+ users/day)**
**Recommended: PositionStack or Radar**
- PositionStack: Best value for high volume ($0.005-0.010 per user)
- Radar: Competitive rates with reliable service
- Both offer enterprise-grade reliability

---

## Real Estate Specific Considerations

### **For Fix-and-Flip Investors (High Search Volume)**
- **Primary**: HERE Maps (generous free tier)
- **Secondary**: PositionStack (cost-effective scaling)
- These users may perform 10-15 searches per day

### **For Traditional Buyers (Moderate Search Volume)**
- **Primary**: Mapbox (good free tier + features)
- **Secondary**: Geoapify (daily limits work well)
- Typical usage: 3-5 searches per day

### **Geographic Considerations**
- **US-focused**: Geocodio (optimized for US addresses)
- **International**: HERE Maps or OpenCage
- **EU compliance needed**: OpenCage (GDPR compliant)

---

## Technical Implementation Factors

### **Rate Limits Impact**
- Google Maps: 50 QPS (handles traffic spikes well)
- Mapbox: 16.7 QPS (good for most use cases)
- Geoapify: 5 QPS free (may need paid plan for busy times)
- OpenCage: 1 QPS free (will need paid plan for real usage)

### **Data Storage Requirements**
- **Temporary Results**: Use any provider's standard geocoding
- **Permanent Storage**: Mapbox requires "Permanent" API (5x cost)
- **Caching Strategy**: Most providers allow reasonable caching

---

## Risk Assessment

### **Low Risk Providers**
- Google Maps: Established, reliable, expensive
- HERE Maps: Enterprise-grade, great free tier
- Mapbox: Popular, well-documented, mid-range pricing

### **Medium Risk Providers**
- Radar: Newer but competitive pricing
- Geoapify: Good service but pricing jumps quickly
- OpenCage: Reliable but rate limits are restrictive

### **Higher Risk Providers**
- PositionStack: Great pricing but less established
- LocationIQ: Good value but smaller company

---

## Final Recommendations

### **Best Overall Strategy: Hybrid Approach**

1. **Start with HERE Maps**: Leverage the 250K free requests/month
2. **Scale to PositionStack**: When approaching free tier limits
3. **Enterprise with custom negotiations**: At 50K+ users/day

### **Alternative Conservative Approach**

1. **Start with Mapbox**: Strong ecosystem, good free tier
2. **Monitor usage closely**: Plan transition before hitting limits
3. **Evaluate Radar or Geocodio**: For cost-effective scaling

### **Budget-Conscious Strategy**

1. **LocationIQ for early scaling**: $39/month for significant volume
2. **PositionStack for growth**: Excellent value at high volumes
3. **Custom enterprise deals**: Negotiate at scale

---

## Implementation Timeline

### **Phase 1 (0-3 months)**: FREE
- Implement HERE Maps
- Build basic geocoding infrastructure
- Monitor usage patterns

### **Phase 2 (3-12 months)**: $39-100/month
- Scale with LocationIQ or PositionStack
- Optimize request patterns
- Implement caching strategies

### **Phase 3 (12+ months)**: Custom pricing
- Negotiate enterprise contracts
- Consider multi-provider redundancy
- Optimize for specific use cases

---

*Report generated: September 26, 2025*
*Pricing subject to change - verify with providers before implementation*
