Gem::Specification.new do |s|
  s.name = "typeout"
  s.version = "1.4.1"
  s.date = "2010-7-8"
  s.authors = ["Connor McKay"]
  s.email = ["connor@verticalforest.com"]
  s.summary = "Dead simple plain text to HTML converter"
  s.files = ["README.rdoc", "LICENSE", "lib/typeout.js", "lib/typeout.rb"]
  
  s.required_rubygems_version = ">= 1.3.6"
  
  s.add_runtime_dependency "sanitize"
  
  s.require_paths = "lib"
end