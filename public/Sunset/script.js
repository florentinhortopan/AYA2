// Decision tree logic implementation
function evaluateDecision(formData) {
    // Step 1: Check legal removal
    if (formData.legalRemoval === 'yes') {
        return {
            type: 'end',
            action: '410/404 + Custom "Campaign Ended" 404',
            details: [
                'Legal/compliance requires removal',
                'Display friendly 404 page with context',
                'Include search functionality and top navigation links',
                'Provide helpful navigation to users'
            ]
        };
    }

    // Step 2: Check if recurring theme
    if (formData.recurring === 'yes') {
        // Check if high value
        const isHighValue = (
            formData.traffic === 'high' ||
            formData.backlinks === 'high' ||
            formData.conversions === 'high'
        );

        // Consider content relevancy and sunset frequency
        const highRelevancy = formData.contentRelevancy === 'high';
        const frequentSunsets = formData.sunsetFrequency === 'frequent' || formData.sunsetFrequency === 'very-frequent';

        if (isHighValue) {
            // Check if existing hub exists
            if (formData.existingHub === 'yes') {
                return {
                    type: 'redirect',
                    action: '301 Redirect Campaign URL to Existing Hub',
                    details: [
                        'Recurring theme with high value',
                        'Existing hub URL already exists',
                        'Redirect /campaign-year → /campaign-hub',
                        'Preserve SEO value and user experience',
                        ...(frequentSunsets ? ['Frequent sunsets detected - redirect preferred over new hub creation'] : []),
                        ...(highRelevancy ? ['High content relevancy supports redirect to existing hub'] : [])
                    ]
                };
            } else {
                // High relevancy + rare sunsets = invest in hub
                // Low relevancy or frequent sunsets = consider redirect or archive
                if (highRelevancy && !frequentSunsets) {
                    return {
                        type: 'keep',
                        action: 'Convert URL into Evergreen Hub',
                        details: [
                            'Recurring theme with high value',
                            'High content relevancy after campaign ends',
                            'Rare/occasional sunsets - worth investing in hub',
                            'No existing hub URL found',
                            'Keep the current URL',
                            'Remove time-sensitive offers',
                            'Apply "Evergreen Hub Template"',
                            'Update copy and CTAs for evergreen content',
                            'Simplified evergreen layout'
                        ]
                    };
                } else if (frequentSunsets) {
                    // Frequent sunsets - prefer redirect or archive over hub creation
                    return {
                        type: 'redirect',
                        action: '301 Redirect to Best-Fit Hub/Category (Frequent Sunsets)',
                        details: [
                            'Recurring theme with high value',
                            'Frequent sunsets detected - streamline process',
                            'No existing hub URL found',
                            'Redirect to closest relevant hub/category instead of creating new hub',
                            'More efficient for frequent sunset scenarios',
                            'Preserve SEO value while reducing maintenance overhead',
                            ...(formData.contentRelevancy === 'low' ? ['Low content relevancy supports redirect over hub'] : [])
                        ]
                    };
                } else {
                    return {
                        type: 'keep',
                        action: 'Convert URL into Evergreen Hub',
                        details: [
                            'Recurring theme with high value',
                            'No existing hub URL found',
                            'Keep the current URL',
                            'Remove time-sensitive offers',
                            'Apply "Evergreen Hub Template"',
                            'Update copy and CTAs for evergreen content',
                            'Simplified evergreen layout'
                        ]
                    };
                }
            }
        } else {
            // Not high value but recurring - check for existing hub
            if (formData.existingHub === 'yes') {
                return {
                    type: 'redirect',
                    action: '301 Redirect Campaign URL to Existing Hub',
                    details: [
                        'Recurring theme but lower value',
                        'Existing hub URL exists',
                        'Redirect to consolidate content',
                        'Maintain user experience'
                    ]
                };
            } else {
                // Check if has backlinks worth preserving
                const hasBacklinks = formData.backlinks === 'medium' || formData.backlinks === 'high';
                const hasSomeValue = formData.traffic === 'medium' || formData.backlinks === 'medium' || formData.conversions === 'medium';
                const highRelevancy = formData.contentRelevancy === 'high';
                const mediumRelevancy = formData.contentRelevancy === 'medium';
                const frequentSunsets = formData.sunsetFrequency === 'frequent' || formData.sunsetFrequency === 'very-frequent';
                const occasionalSunsets = formData.sunsetFrequency === 'rare' || formData.sunsetFrequency === 'occasional';
                
                if (hasBacklinks && hasSomeValue) {
                    // High relevancy might push toward hub, medium relevancy toward nested, low/frequent toward archive
                    if (highRelevancy && !frequentSunsets) {
                        return {
                            type: 'keep',
                            action: 'Convert URL into Hub (High Relevancy)',
                            details: [
                                'Recurring theme with low-medium value',
                                'High content relevancy after campaign ends',
                                'Rare/occasional sunsets - worth investing in hub',
                                'Has backlinks worth preserving',
                                'No existing hub URL',
                                'Convert to simplified evergreen hub',
                                'Content remains valuable, making hub worthwhile',
                                'Can grow into full hub as value increases'
                            ]
                        };
                    } else if (mediumRelevancy && occasionalSunsets) {
                        return {
                            type: 'nested',
                            action: 'Nested Page / De-link (Remove from Primary Navigation)',
                            details: [
                                'Recurring theme with low-medium value',
                                'Medium content relevancy - useful but not primary',
                                'Occasional/rare sunsets - content should remain discoverable',
                                'Has backlinks worth preserving',
                                'No existing hub URL',
                                'Keep URL accessible and indexed (no noindex tag)',
                                'Remove from PRIMARY navigation (main menu, homepage links)',
                                'Keep in secondary/deep navigation (footer, sitemap, deep pages)',
                                'Reduce internal link prominence (fewer links, deeper in hierarchy)',
                                'Consider moving to deeper URL structure (/archive/, /past-campaigns/, etc.)',
                                'Content remains discoverable via search and deep navigation',
                                'Less prominent than hub, more discoverable than archive',
                                'Can be upgraded to hub later if relevancy/value increases'
                            ]
                        };
                    } else {
                        return {
                            type: 'archive',
                            action: 'Keep Live but Not Prominently Linked (Archive)',
                            details: [
                                'Recurring theme with low-medium value',
                                'Has backlinks worth preserving',
                                'No existing hub URL',
                                ...(frequentSunsets ? ['Frequent sunsets - archive preferred over hub creation'] : []),
                                ...(formData.contentRelevancy === 'low' ? ['Low content relevancy - archive preferred'] : []),
                                'Keep page live but de-prioritize it',
                                'Remove from main navigation and sitemaps',
                                'Add noindex meta tag (preserve link equity without ranking)',
                                'Remove internal links except contextual references',
                                'Keep accessible via direct URL for existing backlinks',
                                'Consider this as beginning of evergreen hub strategy',
                                'Can be upgraded to full hub later if value increases'
                            ]
                        };
                    }
                } else {
                    // Low value, check relevancy and frequency
                    if (frequentSunsets || formData.contentRelevancy === 'low') {
                        return {
                            type: 'redirect',
                            action: '301 Redirect to Best-Fit Hub/Category',
                            details: [
                                'Recurring theme but lower value',
                                ...(frequentSunsets ? ['Frequent sunsets - redirect preferred'] : []),
                                ...(formData.contentRelevancy === 'low' ? ['Low content relevancy - redirect preferred'] : []),
                                'No existing hub URL',
                                'Redirect to closest relevant hub/category',
                                'More efficient than creating new hub for low-value content'
                            ]
                        };
                    } else {
                        return {
                            type: 'keep',
                            action: 'Convert URL into Hub (Lower Priority)',
                            details: [
                                'Recurring theme but lower value',
                                'Medium content relevancy - consider hub conversion',
                                'No existing hub URL',
                                'Consider converting to hub if resources allow',
                                'Simplified evergreen layout'
                            ]
                        };
                    }
                }
            }
        }
    }

    // Step 3: Not recurring - check page value
    if (formData.recurring === 'no') {
        const pageValue = determinePageValue(formData.traffic, formData.backlinks, formData.conversions);
        const highRelevancy = formData.contentRelevancy === 'high';
        const frequentSunsets = formData.sunsetFrequency === 'frequent' || formData.sunsetFrequency === 'very-frequent';

        if (pageValue === 'high' || pageValue === 'medium') {
            // High relevancy might suggest keeping as content page instead of redirect
            if (highRelevancy && !frequentSunsets && formData.intent === 'content') {
                return {
                    type: 'keep',
                    action: 'Convert to Evergreen Content Page',
                    details: [
                        'Non-recurring campaign with high/medium value',
                        'High content relevancy after campaign ends',
                        'Content intent - content remains valuable',
                        'Rare/occasional sunsets - worth maintaining',
                        'Keep URL and convert to evergreen content page',
                        'Remove time-sensitive elements',
                        'Update to evergreen content format',
                        'Maintain in content hub/navigation'
                    ]
                };
            }
            
            // Determine intent
            if (formData.intent === 'product') {
                return {
                    type: 'redirect',
                    action: '301 Redirect to Best-Fit Category/PLP',
                    details: [
                        'Non-recurring campaign with high/medium value',
                        'Dominant intent: Product',
                        'Redirect to closest relevant category page',
                        'Redirect to Product Listing Page (PLP)',
                        'Preserve SEO value and user intent',
                        ...(frequentSunsets ? ['Frequent sunsets - redirect preferred'] : []),
                        ...(formData.contentRelevancy === 'low' ? ['Low content relevancy - redirect preferred'] : [])
                    ]
                };
            } else if (formData.intent === 'content') {
                return {
                    type: 'redirect',
                    action: '301 Redirect to Best-Fit Content Hub',
                    details: [
                        'Non-recurring campaign with high/medium value',
                        'Dominant intent: Content',
                        'Redirect to closest relevant content hub',
                        'Based on taxonomy tags and content similarity',
                        'Maintain content discovery',
                        ...(frequentSunsets ? ['Frequent sunsets - redirect preferred'] : [])
                    ]
                };
            } else if (formData.intent === 'brand') {
                return {
                    type: 'redirect',
                    action: '301 Redirect to Best-Fit Brand/App/Loyalty Page',
                    details: [
                        'Non-recurring campaign with high/medium value',
                        'Dominant intent: Brand',
                        'Redirect to brand page, app page, or loyalty program',
                        'Maintain brand connection',
                        ...(frequentSunsets ? ['Frequent sunsets - redirect preferred'] : [])
                    ]
                };
            } else {
                return {
                    type: 'data',
                    action: 'Manual Review Required - Determine Intent',
                    details: [
                        'Non-recurring campaign with high/medium value',
                        'Intent not clearly determined',
                        'Review keywords, CTAs, and page content',
                        'Determine if product, content, or brand intent',
                        'Then apply appropriate redirect strategy',
                        ...(highRelevancy ? ['High content relevancy detected - consider keeping as content'] : []),
                        ...(frequentSunsets ? ['Frequent sunsets - prefer redirects'] : [])
                    ]
                };
            }
        } else {
            // Low value page
            if (formData.relevantHub === 'yes') {
                return {
                    type: 'redirect',
                    action: '301 Redirect to Loosely Relevant Hub/Category',
                    details: [
                        'Non-recurring campaign with low value',
                        'Loosely relevant hub/category exists',
                        'Redirect to maintain some user flow',
                        'Better than 404 but not ideal',
                        ...(frequentSunsets ? ['Frequent sunsets - redirect preferred'] : []),
                        ...(formData.contentRelevancy === 'low' ? ['Low content relevancy - redirect preferred'] : [])
                    ]
                };
            } else {
                // Check if has backlinks worth preserving before 404ing
                const hasBacklinks = formData.backlinks === 'medium' || formData.backlinks === 'high';
                const mediumRelevancy = formData.contentRelevancy === 'medium';
                const pageValue = determinePageValue(formData.traffic, formData.backlinks, formData.conversions);
                const occasionalSunsets = formData.sunsetFrequency === 'rare' || formData.sunsetFrequency === 'occasional';
                
                if (hasBacklinks) {
                    // Check if medium relevancy + occasional sunsets = nested page
                    if (mediumRelevancy && occasionalSunsets && (pageValue === 'medium' || pageValue === 'low')) {
                        return {
                            type: 'nested',
                            action: 'Nested Page / De-link (Remove from Primary Navigation)',
                            details: [
                                'Non-recurring campaign with low-medium value',
                                'Medium content relevancy - useful but not primary',
                                'Occasional/rare sunsets - content should remain discoverable',
                                'Has backlinks worth preserving',
                                'No relevant hub/category found',
                                'Keep URL accessible and indexed (no noindex tag)',
                                'Remove from PRIMARY navigation (main menu, homepage links)',
                                'Keep in secondary/deep navigation (footer, sitemap, deep pages)',
                                'Reduce internal link prominence (fewer links, deeper in hierarchy)',
                                'Consider moving to deeper URL structure (/archive/, /past-campaigns/, etc.)',
                                'Content remains discoverable via search and deep navigation',
                                'Less prominent than hub, more discoverable than archive',
                                'Prevents broken backlinks while reducing prominence'
                            ]
                        };
                    } else {
                        return {
                            type: 'archive',
                            action: 'Keep Live but Not Prominently Linked (Archive)',
                            details: [
                                'Non-recurring campaign with low value',
                                'Has backlinks worth preserving',
                                'No relevant hub/category found',
                                ...(frequentSunsets ? ['Frequent sunsets - archive preferred over hub'] : []),
                                ...(formData.contentRelevancy === 'low' ? ['Low content relevancy - archive preferred'] : []),
                                'Keep page live but de-prioritize it',
                                'Remove from main navigation and sitemaps',
                                'Add noindex meta tag (preserve link equity without ranking)',
                                'Remove internal links except contextual references',
                                'Keep accessible via direct URL for existing backlinks',
                                'Display minimal content: "Campaign ended" notice',
                                'Prevents broken backlinks while deprioritizing the resource',
                                'Better than 404 for SEO, less maintenance than full hub'
                            ]
                        };
                    }
                } else {
                    return {
                        type: 'end',
                        action: '410/404 + Custom "Campaign Ended" 404',
                        details: [
                            'Non-recurring campaign with low value',
                            'No relevant hub/category found',
                            'No significant backlinks to preserve',
                            ...(frequentSunsets ? ['Frequent sunsets - 404 acceptable for low-value content'] : []),
                            ...(formData.contentRelevancy === 'low' ? ['Low content relevancy - 404 acceptable'] : []),
                            'Display friendly 404 page',
                            'Include contextual copy: "This campaign has ended"',
                            'Smart navigation: top categories, search, featured content',
                            'Help users find alternative content'
                        ]
                    };
                }
            }
        }
    }

    // Default fallback
    return {
        type: 'data',
        action: 'Flag for Manual UX/SEO Review',
        details: [
            'Edge case detected',
            'Insufficient information to make automated decision',
            'Requires manual review by UX/SEO team',
            'Consider all factors: traffic, backlinks, conversions, intent, relevance'
        ]
    };
}

function determinePageValue(traffic, backlinks, conversions) {
    const highCount = [traffic, backlinks, conversions].filter(v => v === 'high').length;
    const mediumCount = [traffic, backlinks, conversions].filter(v => v === 'medium').length;
    
    if (highCount >= 2 || (highCount === 1 && mediumCount >= 1)) {
        return 'high';
    } else if (highCount === 1 || mediumCount >= 2) {
        return 'medium';
    } else {
        return 'low';
    }
}

function showNextSection() {
    const legalRemoval = document.querySelector('input[name="legalRemoval"]:checked')?.value;
    
    // Always show legal section (it's the first question)
    document.querySelector('.form-section:first-of-type').style.display = 'block';
    
    if (!legalRemoval) {
        // Hide all other sections if legal removal not selected
        document.getElementById('strategicSection').style.display = 'none';
        document.getElementById('recurringSection').style.display = 'none';
        document.getElementById('valueSection').style.display = 'none';
        document.getElementById('hubSection').style.display = 'none';
        document.getElementById('intentSection').style.display = 'none';
        document.getElementById('relevantHubSection').style.display = 'none';
        return;
    }

    if (legalRemoval === 'yes') {
        // Legal removal - hide all other sections
        document.getElementById('strategicSection').style.display = 'none';
        document.getElementById('recurringSection').style.display = 'none';
        document.getElementById('valueSection').style.display = 'none';
        document.getElementById('hubSection').style.display = 'none';
        document.getElementById('intentSection').style.display = 'none';
        document.getElementById('relevantHubSection').style.display = 'none';
        return;
    }

    // Show strategic section (frequency and relevancy)
    document.getElementById('strategicSection').style.display = 'block';
    
    // Show recurring section
    document.getElementById('recurringSection').style.display = 'block';
    
    const recurring = document.querySelector('input[name="recurring"]:checked')?.value;
    if (!recurring) {
        // Hide dependent sections
        document.getElementById('valueSection').style.display = 'none';
        document.getElementById('hubSection').style.display = 'none';
        document.getElementById('intentSection').style.display = 'none';
        document.getElementById('relevantHubSection').style.display = 'none';
        return;
    }

    // Show value section
    document.getElementById('valueSection').style.display = 'block';
    
    const traffic = document.getElementById('trafficSelect').value;
    const backlinks = document.getElementById('backlinksSelect').value;
    const conversions = document.getElementById('conversionsSelect').value;
    
    // Hide intent and relevant hub sections initially
    document.getElementById('intentSection').style.display = 'none';
    document.getElementById('relevantHubSection').style.display = 'none';
    document.getElementById('hubSection').style.display = 'none';

    if (recurring === 'yes') {
        // For recurring themes, show hub section if value is assessed
        if (traffic || backlinks || conversions) {
            document.getElementById('hubSection').style.display = 'block';
        }
    } else {
        // For non-recurring, check page value
        if (traffic || backlinks || conversions) {
            const pageValue = determinePageValue(traffic, backlinks, conversions);
            
            if (pageValue === 'high' || pageValue === 'medium') {
                document.getElementById('intentSection').style.display = 'block';
            } else {
                document.getElementById('relevantHubSection').style.display = 'block';
            }
        }
    }
}

function resetForm() {
    document.getElementById('decisionForm').reset();
    document.getElementById('resultSection').style.display = 'none';
    showNextSection();
}

function displayResult(result) {
    const resultSection = document.getElementById('resultSection');
    const outcomeDiv = document.getElementById('outcome');
    const detailsDiv = document.getElementById('details');

    outcomeDiv.className = `outcome ${result.type}`;
    outcomeDiv.textContent = result.action;

    detailsDiv.innerHTML = `
        <h3>Details:</h3>
        <ul>
            ${result.details.map(detail => `<li>${detail}</li>`).join('')}
        </ul>
    `;

    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('decisionForm');
    
    // Initialize - show first section
    showNextSection();
    
    // Show/hide sections dynamically
    form.addEventListener('change', function(e) {
        showNextSection();
    });

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            legalRemoval: document.querySelector('input[name="legalRemoval"]:checked')?.value,
            sunsetFrequency: document.getElementById('sunsetFrequencySelect').value,
            contentRelevancy: document.getElementById('contentRelevancySelect').value,
            recurring: document.querySelector('input[name="recurring"]:checked')?.value,
            traffic: document.getElementById('trafficSelect').value,
            backlinks: document.getElementById('backlinksSelect').value,
            conversions: document.getElementById('conversionsSelect').value,
            existingHub: document.querySelector('input[name="existingHub"]:checked')?.value,
            intent: document.querySelector('input[name="intent"]:checked')?.value,
            relevantHub: document.querySelector('input[name="relevantHub"]:checked')?.value
        };

        // Validate required fields
        if (!formData.legalRemoval) {
            alert('Please select whether legal removal is required.');
            return;
        }

        if (formData.legalRemoval === 'no') {
            // Validate strategic factors
            if (!formData.sunsetFrequency) {
                alert('Please select the frequency of campaign page sunsets.');
                return;
            }
            if (!formData.contentRelevancy) {
                alert('Please select the content relevancy after campaign ends.');
                return;
            }
            
            if (!formData.recurring) {
                alert('Please select whether this is a recurring theme.');
                return;
            }
            
            // Validate value section
            if (!formData.traffic && !formData.backlinks && !formData.conversions) {
                alert('Please provide at least one value metric (traffic, backlinks, or conversions).');
                return;
            }
            
            // Validate dependent fields
            if (formData.recurring === 'yes') {
                if (!formData.existingHub) {
                    alert('Please indicate if an existing hub URL exists.');
                    return;
                }
            } else {
                const pageValue = determinePageValue(formData.traffic, formData.backlinks, formData.conversions);
                if (pageValue === 'high' || pageValue === 'medium') {
                    if (!formData.intent) {
                        alert('Please select the page intent (product, content, or brand).');
                        return;
                    }
                } else {
                    if (!formData.relevantHub) {
                        alert('Please indicate if a loosely relevant hub/category exists.');
                        return;
                    }
                }
            }
        }

        const result = evaluateDecision(formData);
        displayResult(result);
    });
});
