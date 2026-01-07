#!/usr/bin/env python3
import csv
import struct
import gzip
import sys
from pathlib import Path

MAGIC = b'HYGB'
VERSION = 1
EPOCH_TEXT = 'J2000.0'


def write_header(f, star_count, mag_limit):
    f.write(MAGIC)
    f.write(struct.pack('<f', mag_limit))
    f.write(struct.pack('<I', VERSION))
    f.write(struct.pack('<I', star_count))
    epoch_bytes = EPOCH_TEXT.encode('utf-8')
    if len(epoch_bytes) < 24:
        epoch_bytes = epoch_bytes + b'\x00' * (24 - len(epoch_bytes))
    f.write(epoch_bytes)


def write_star_data(f, stars):
    for star in stars:
        ra = float(star.get('ra', 0))
        dec = float(star.get('dec', 0))
        mag = float(star.get('mag', 99))
        bv = float(star.get('bv', 0))
        f.write(struct.pack('<ffff', ra, dec, mag, bv))


def write_names_data(f, named_stars):
    name_count = len(named_stars)
    f.write(struct.pack('<I', name_count))
    
    for hip_id, name in sorted(named_stars.items()):
        name_bytes = name.encode('utf-8')
        f.write(struct.pack('<I', hip_id))
        f.write(struct.pack('<H', len(name_bytes)))
        f.write(name_bytes)


def convert_hyg_to_binary(csv_path, output_path, mag_limit=9.0):
    print(f"Reading HYG catalog from {csv_path}")
    
    stars = []
    named_stars = {}
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row_num, row in enumerate(reader, 1):
            try:
                ra_str = row.get('ra', '0')
                dec_str = row.get('dec', '0')
                mag_str = row.get('mag', '99')
                bv_str = row.get('bv', '0')
                
                if not ra_str or not dec_str or not mag_str or not bv_str:
                    continue
                    
                ra = float(ra_str)
                dec = float(dec_str)
                mag = float(mag_str)
                bv = float(bv_str)
                
                stars.append({
                    'ra': ra,
                    'dec': dec,
                    'mag': mag,
                    'bv': bv
                })
                
                if mag <= mag_limit:
                    hip_str = row.get('hip', '0')
                    if not hip_str:
                        continue
                    hip_id = int(hip_str)
                    
                    proper_name = row.get('proper', '').strip()
                    bayer = row.get('bay', '').strip()
                    flamsteed = row.get('flam', '').strip()
                    
                    name = proper_name if proper_name else (f"{bayer} {flamsteed}" if bayer and flamsteed else "")
                    
                    if name and hip_id not in named_stars:
                        named_stars[hip_id] = name
                
                if row_num % 10000 == 0:
                    print(f"Processed {row_num} rows...")
                    
            except (ValueError, KeyError, IndexError) as e:
                print(f"Warning: Skipping row {row_num}: {e}")
                continue
    
    print(f"Loaded {len(stars)} total stars")
    print(f"Found {len(named_stars)} named stars")
    print(f"Writing binary to {output_path}")
    
    with open(output_path, 'wb') as f:
        write_header(f, len(stars), mag_limit)
        write_star_data(f, stars)
        write_names_data(f, named_stars)
    
    print("Conversion complete")
    
    file_size = Path(output_path).stat().st_size
    print(f"Binary file size: {file_size:,} bytes ({file_size / 1024 / 1024:.2f} MB)")
    
    gz_path = str(Path(output_path).with_suffix('.bin.gz'))
    
    print("\nCompressing with gzip...")
    with open(output_path, 'rb') as f_in:
        with gzip.open(gz_path, 'wb') as f_out:
            f_out.writelines(f_in)
    
    gz_size = Path(gz_path).stat().st_size
    print(f"Gzipped size: {gz_size:,} bytes ({gz_size / 1024 / 1024:.2f} MB)")
    print(f"Compression ratio: {gz_size / file_size * 100:.1f}%")


def main():
    if len(sys.argv) < 3:
        print("Usage: python convert_hyg_to_binary.py <input.csv> <output.bin> [mag_limit]")
        print("Example: python convert_hyg_to_binary.py hygdata_v42.csv hygdata.bin 9.0")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    output_path = sys.argv[2]
    mag_limit = float(sys.argv[3]) if len(sys.argv) > 3 else 9.0
    
    if not Path(csv_path).exists():
        print(f"Error: {csv_path} not found")
        sys.exit(1)
    
    convert_hyg_to_binary(csv_path, output_path, mag_limit)
    
    print(f"\nExpected header size: 52 bytes")
    print(f"Expected star data size: {119626 * 16} bytes = 1,914,016 bytes")
    print(f"Expected names section: 4 + 2 bytes per name bytes = unknown")
    
    final_file = str(Path(output_path).with_suffix('.bin.gz'))
    actual_size = Path(final_file).stat().st_size
    print(f"\nActual final file size: {actual_size:,} bytes ({actual_size / 1024 / 1024:.2f} MB)")


if __name__ == '__main__':
    main()
