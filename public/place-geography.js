// This module and its boundary data are dynamically imported only by the places page.
import topology from './vendor/taiwan-topology.js';
import {feature} from './vendor/topojson.js';
import {createTaiwanDistrictIndex} from './place-geometry.js';
export const taiwanDistricts=createTaiwanDistrictIndex(feature(topology,topology.objects.towns).features);
export const locateTaiwanDistrict=(lat,lng)=>taiwanDistricts.locateTaiwanDistrict(lat,lng);
