Gem::Specification.new do |s|
  s.name = "typeout"
  s.version = "1.4.6"
  s.date = "2013-09-15"
  s.authors = ["Connor McKay"]
  s.email = ["connor@verticalforest.com"]
  s.summary = "Dead simple plain text to HTML converter"
  s.homepage = "http://github.com/greneholt/typeout"
  s.files = ["README.rdoc", "LICENSE", "lib/typeout.js", "lib/typeout.rb"]

  s.required_rubygems_version = ">= 1.3.5"
  s.rubyforge_project = "typeout"

  s.add_runtime_dependency "sanitize"

  s.require_paths = ["lib"]
end
