import type { SearchItem } from '../types'

export function getSampleData(): SearchItem[] {
  return [
    {
      query: 'red running shoes',
      item_title: 'Nike Air Zoom Pegasus 39',
      item_description:
        'Experience ultimate comfort and performance with these vibrant red running shoes. Featuring advanced Zoom Air technology for responsive cushioning and durable traction.',
      item_category: 'Footwear',
      item_attributes: {
        color: 'red',
        size: '9',
        brand: 'Nike',
        price: '$129.99',
      },
      claimed: false,
    },
    {
      query: 'blue summer dress',
      item_title: 'Floral Maxi Dress',
      item_description:
        'Elegant floor-length summer dress with soft cotton fabric and blue floral pattern.',
      item_category: 'Clothing',
      item_attributes: {
        color: 'blue',
        material: 'cotton',
        length: 'maxi',
        occasion: 'casual',
      },
      claimed: false,
    },
    {
      query: 'smartwatch with GPS',
      item_title: 'Apple Watch Series 9',
      item_description:
        'Advanced smartwatch with GPS, health tracking, and bright Retina display.',
      item_category: 'Wearables',
      item_attributes: {
        color: 'midnight',
        size: '45mm',
        brand: 'Apple',
        price: '$399.99',
      },
      claimed: false,
    },
  ]
}
